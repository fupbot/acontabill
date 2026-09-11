import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useCurrentUser } from "../context/CurrentUserContext";
import type { RootStackParamList } from "../navigation/types";
import { listCategories } from "../repositories/categories";
import { createExpense } from "../repositories/expenses";
import { listGroupMembers } from "../repositories/groups";
import { theme } from "../theme";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "AddExpense">;

const DEFAULT_CURRENCY = "BRL";

export function AddExpenseScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const currentUser = useCurrentUser();
  const { data: members } = useLiveQuery(listGroupMembers(groupId));
  const { data: categories } = useLiveQuery(listCategories(groupId));

  const [description, setDescription] = useState("");
  const [amountText, setAmountText] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [paidByUserId, setPaidByUserId] = useState(currentUser.id);
  const [participantIds, setParticipantIds] = useState<Set<string>>(new Set([currentUser.id]));

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

  const amountCents = Math.round(Number.parseFloat(amountText.replace(",", ".")) * 100);
  const canSubmit =
    description.trim().length > 0 &&
    Number.isFinite(amountCents) &&
    amountCents > 0 &&
    participantIds.size > 0;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }
    await createExpense({
      groupId,
      description: description.trim(),
      amountCents,
      currency: DEFAULT_CURRENCY,
      date: new Date(),
      categoryId,
      paidByUserId,
      participantUserIds: Array.from(participantIds),
    });
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

      <Text style={styles.label}>Amount ({DEFAULT_CURRENCY})</Text>
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

      <Text style={styles.label}>Split equally between</Text>
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

      <Pressable
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        disabled={!canSubmit}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>Add expense</Text>
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
