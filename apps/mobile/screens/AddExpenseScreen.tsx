import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useCurrentUser } from "../context/CurrentUserContext";
import type { RootStackParamList } from "../navigation/types";
import { listCategories } from "../repositories/categories";
import { computeSplits, type SplitConfig } from "../repositories/expense-splitting";
import { createExpense, getExpenseWithSplits, updateExpense } from "../repositories/expenses";
import { listGroupMembers } from "../repositories/groups";
import { theme } from "../theme";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "AddExpense">;

const DEFAULT_CURRENCY = "BRL";

const SPLIT_TYPES = [
  { value: "equal", label: "Equal" },
  { value: "percentage", label: "Percentage" },
  { value: "exact", label: "Exact" },
  { value: "shares", label: "Shares" },
] as const;

type SplitType = (typeof SPLIT_TYPES)[number]["value"];

export function AddExpenseScreen({ route, navigation }: Props) {
  const { groupId, expenseId } = route.params;
  const isEditing = Boolean(expenseId);
  const currentUser = useCurrentUser();
  const { data: members } = useLiveQuery(listGroupMembers(groupId));
  const { data: categories } = useLiveQuery(listCategories(groupId));

  const [description, setDescription] = useState("");
  const [amountText, setAmountText] = useState("");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [paidByUserId, setPaidByUserId] = useState(currentUser.id);
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [participantIds, setParticipantIds] = useState<Set<string>>(new Set([currentUser.id]));
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of members ?? []) {
      map.set(member.userId, member.name);
    }
    return map;
  }, [members]);

  // Load the existing expense once when editing, and prefill the form from
  // it. Percentages are reconstructed from the stored amounts (accurate up
  // to rounding); "shares" aren't stored as their own number — only the
  // resulting amounts are — so editing a shares-split expense resets each
  // person to 1 share rather than guessing at the original ratio.
  useEffect(() => {
    if (!expenseId) {
      return;
    }
    getExpenseWithSplits(expenseId).then((result) => {
      if (!result) {
        return;
      }
      const { expense, splits } = result;
      setDescription(expense.description);
      setAmountText((expense.amountCents / 100).toFixed(2));
      setCurrency(expense.currency);
      setCategoryId(expense.categoryId ?? undefined);
      setPaidByUserId(expense.paidByUserId);
      setSplitType(expense.splitType);
      setParticipantIds(new Set(splits.map((split) => split.userId)));

      if (expense.splitType === "percentage") {
        setSplitValues(
          Object.fromEntries(
            splits.map((split) => [
              split.userId,
              ((split.amountCents / expense.amountCents) * 100).toFixed(2),
            ]),
          ),
        );
      } else if (expense.splitType === "exact") {
        setSplitValues(
          Object.fromEntries(
            splits.map((split) => [split.userId, (split.amountCents / 100).toFixed(2)]),
          ),
        );
      }
    });
  }, [expenseId]);

  function toggleParticipant(userId: string) {
    setParticipantIds((current) => {
      const next = new Set(current);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  function handleSplitTypeChange(type: SplitType) {
    setSplitType(type);
    setSplitValues({});
  }

  const amountCents = Math.round(Number.parseFloat(amountText.replace(",", ".")) * 100);

  const splitConfig: SplitConfig = useMemo(() => {
    const participantList = Array.from(participantIds);
    switch (splitType) {
      case "percentage":
        return {
          type: "percentage",
          entries: participantList.map((userId) => ({
            userId,
            percentage: Number.parseFloat((splitValues[userId] ?? "").replace(",", ".")) || 0,
          })),
        };
      case "exact":
        return {
          type: "exact",
          entries: participantList.map((userId) => ({
            userId,
            amountCents: Math.round(
              (Number.parseFloat((splitValues[userId] ?? "").replace(",", ".")) || 0) * 100,
            ),
          })),
        };
      case "shares":
        return {
          type: "shares",
          entries: participantList.map((userId) => ({
            userId,
            shares: Number.parseInt(splitValues[userId] ?? "1", 10) || 0,
          })),
        };
      case "equal":
      default:
        return { type: "equal", participantUserIds: participantList };
    }
  }, [splitType, participantIds, splitValues]);

  const splitPreview = useMemo(() => {
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return { error: null as string | null, splits: [] };
    }
    try {
      return { error: null, splits: computeSplits(amountCents, splitConfig) };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Invalid split", splits: [] };
    }
  }, [amountCents, splitConfig]);

  const canSubmit =
    description.trim().length > 0 &&
    Number.isFinite(amountCents) &&
    amountCents > 0 &&
    splitPreview.splits.length > 0 &&
    !splitPreview.error;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }
    const input = {
      groupId,
      description: description.trim(),
      amountCents,
      currency,
      date: new Date(),
      categoryId,
      paidByUserId,
      split: splitConfig,
    };

    if (isEditing && expenseId) {
      await updateExpense(expenseId, input);
    } else {
      await createExpense(input);
    }
    navigation.goBack();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: theme.spacing(2) }}>
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Groceries"
        placeholderTextColor={theme.colors.textMuted}
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Amount ({currency})</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor={theme.colors.textMuted}
        keyboardType="decimal-pad"
        value={amountText}
        onChangeText={setAmountText}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipsRow}>
        {categories?.map((category) => (
          <Pressable
            key={category.id}
            style={[styles.chip, categoryId === category.id && styles.chipSelected]}
            onPress={() => setCategoryId(category.id)}
          >
            <Text style={styles.chipText}>{category.name}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Paid by</Text>
      <View style={styles.chipsRow}>
        {members?.map((member) => (
          <Pressable
            key={member.userId}
            style={[styles.chip, paidByUserId === member.userId && styles.chipSelected]}
            onPress={() => setPaidByUserId(member.userId)}
          >
            <Text style={styles.chipText}>{member.name}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Split type</Text>
      <View style={styles.chipsRow}>
        {SPLIT_TYPES.map((type) => (
          <Pressable
            key={type.value}
            style={[styles.chip, splitType === type.value && styles.chipSelected]}
            onPress={() => handleSplitTypeChange(type.value)}
          >
            <Text style={styles.chipText}>{type.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Split between</Text>
      <View style={styles.chipsRow}>
        {members?.map((member) => (
          <Pressable
            key={member.userId}
            style={[styles.chip, participantIds.has(member.userId) && styles.chipSelected]}
            onPress={() => toggleParticipant(member.userId)}
          >
            <Text style={styles.chipText}>{member.name}</Text>
          </Pressable>
        ))}
      </View>

      {splitType !== "equal" &&
        Array.from(participantIds).map((userId) => (
          <View key={userId} style={styles.splitValueRow}>
            <Text style={styles.splitValueName}>{nameById.get(userId) ?? "?"}</Text>
            <TextInput
              style={styles.splitValueInput}
              placeholder={splitType === "shares" ? "1" : "0"}
              placeholderTextColor={theme.colors.textMuted}
              keyboardType={splitType === "shares" ? "number-pad" : "decimal-pad"}
              value={splitValues[userId] ?? ""}
              onChangeText={(text) => setSplitValues((prev) => ({ ...prev, [userId]: text }))}
            />
          </View>
        ))}
      {splitPreview.error && <Text style={styles.errorText}>{splitPreview.error}</Text>}

      <Pressable
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        disabled={!canSubmit}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>{isEditing ? "Save changes" : "Add expense"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(1),
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing(1),
  },
  chip: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.75),
  },
  chipSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: "#1f3d30",
  },
  chipText: {
    color: theme.colors.text,
    fontSize: 13,
  },
  splitValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: theme.spacing(1),
  },
  splitValueName: {
    color: theme.colors.text,
  },
  splitValueInput: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.75),
    minWidth: 80,
    textAlign: "right",
  },
  errorText: {
    color: theme.colors.danger,
    marginTop: theme.spacing(1.5),
  },
  submitButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 8,
    paddingVertical: theme.spacing(1.5),
    alignItems: "center",
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(4),
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: "#0a0a0a",
    fontWeight: "700",
  },
});
