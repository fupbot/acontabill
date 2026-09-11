import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { RootStackParamList } from "../navigation/types";
import { addMember, listGroupMembers } from "../repositories/groups";
import { deleteExpense, listExpenses } from "../repositories/expenses";
import { theme } from "../theme";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "GroupDetail">;

function formatAmount(amountCents: number, currency: string) {
  return `${currency} ${(amountCents / 100).toFixed(2)}`;
}

export function GroupDetailScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const { data: members } = useLiveQuery(listGroupMembers(groupId));
  const { data: expenses } = useLiveQuery(listExpenses(groupId));
  const [newMemberName, setNewMemberName] = useState("");

  async function handleAddMember() {
    const name = newMemberName.trim();
    if (!name) {
      return;
    }
    await addMember(groupId, name);
    setNewMemberName("");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Members</Text>
      <View style={styles.membersRow}>
        {members?.map((member) => (
          <View key={member.userId} style={styles.memberChip}>
            <Text style={styles.memberChipText}>
              {member.name}
              {member.role === "admin" ? " · admin" : ""}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.newMemberRow}>
        <TextInput
          style={styles.input}
          placeholder="Add member by name"
          placeholderTextColor={theme.colors.textMuted}
          value={newMemberName}
          onChangeText={setNewMemberName}
          onSubmitEditing={handleAddMember}
        />
        <Pressable style={styles.button} onPress={handleAddMember}>
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.linksRow}>
        <Pressable onPress={() => navigation.navigate("Categories", { groupId })}>
          <Text style={styles.linkText}>Manage categories →</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("SettleUp", { groupId })}>
          <Text style={styles.linkText}>Settle up →</Text>
        </Pressable>
      </View>

      <View style={styles.expensesHeader}>
        <Text style={styles.sectionTitle}>Expenses</Text>
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate("AddExpense", { groupId })}
        >
          <Text style={styles.buttonText}>Add expense</Text>
        </Pressable>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(expense) => expense.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No expenses yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.expenseRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.expenseDescription}>{item.description}</Text>
              <Text style={styles.expenseMeta}>{item.date.toLocaleDateString()}</Text>
            </View>
            <Text style={styles.expenseAmount}>
              {formatAmount(item.amountCents, item.currency)}
            </Text>
            <Pressable
              onPress={() => navigation.navigate("AddExpense", { groupId, expenseId: item.id })}
              hitSlop={8}
            >
              <Text style={styles.linkText}>Edit</Text>
            </Pressable>
            <Pressable onPress={() => deleteExpense(item.id)} hitSlop={8}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing(2),
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: theme.spacing(1),
  },
  membersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  memberChip: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.5),
  },
  memberChipText: {
    color: theme.colors.text,
    fontSize: 13,
  },
  newMemberRow: {
    flexDirection: "row",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(1),
  },
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: 8,
    paddingHorizontal: theme.spacing(2),
    justifyContent: "center",
  },
  buttonText: {
    color: "#0a0a0a",
    fontWeight: "600",
  },
  linksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing(2),
  },
  linkText: {
    color: theme.colors.accent,
    fontWeight: "600",
  },
  expensesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(1),
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1.5),
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
  },
  expenseDescription: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  expenseMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  expenseAmount: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  deleteText: {
    color: theme.colors.danger,
  },
  emptyText: {
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: theme.spacing(4),
  },
});
