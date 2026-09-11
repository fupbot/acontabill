import {
  calculateBalances,
  postingsForExpense,
  postingsForSettlement,
  simplifyDebts,
} from "@acontabill/shared-core";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../navigation/types";
import { listExpenses, listExpenseSplitsForGroup } from "../repositories/expenses";
import { listGroupMembers } from "../repositories/groups";
import { listSettlements, recordSettlement } from "../repositories/settlements";
import { theme } from "../theme";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "SettleUp">;

function formatAmount(amountCents: number, currency: string) {
  return `${currency} ${(amountCents / 100).toFixed(2)}`;
}

export function SettleUpScreen({ route }: Props) {
  const { groupId } = route.params;
  const { data: expenses } = useLiveQuery(listExpenses(groupId));
  const { data: splits } = useLiveQuery(listExpenseSplitsForGroup(groupId));
  const { data: settlementRows } = useLiveQuery(listSettlements(groupId));
  const { data: members } = useLiveQuery(listGroupMembers(groupId));

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of members ?? []) {
      map.set(member.userId, member.name);
    }
    return map;
  }, [members]);

  // Balances are derived from three separately-live-queried tables rather
  // than one query, since useLiveQuery watches a single SQL statement — this
  // recomputes (cheaply, client-side) whenever any of the underlying tables
  // change, via shared-core's pure postings/calculateBalances/simplifyDebts.
  const debtsByCurrency = useMemo(() => {
    const splitsByExpenseId = new Map<string, { userId: string; amountCents: number }[]>();
    for (const split of splits ?? []) {
      const list = splitsByExpenseId.get(split.expenseId) ?? [];
      list.push({ userId: split.userId, amountCents: split.amountCents });
      splitsByExpenseId.set(split.expenseId, list);
    }

    const expensePostings = (expenses ?? []).flatMap((expense) =>
      postingsForExpense({
        currency: expense.currency,
        paidByUserId: expense.paidByUserId,
        amountCents: expense.amountCents,
        splits: splitsByExpenseId.get(expense.id) ?? [],
      }),
    );

    const settlementPostings = (settlementRows ?? []).flatMap((settlement) =>
      postingsForSettlement(settlement),
    );

    const balances = calculateBalances([...expensePostings, ...settlementPostings]);

    return Object.entries(balances).map(([currency, byUser]) => ({
      currency,
      transactions: simplifyDebts(byUser),
    }));
  }, [expenses, splits, settlementRows]);

  async function handleMarkSettled(
    currency: string,
    fromUserId: string,
    toUserId: string,
    amountCents: number,
  ) {
    await recordSettlement({ groupId, currency, fromUserId, toUserId, amountCents });
  }

  const debtRows = debtsByCurrency.flatMap((group) =>
    group.transactions.map((tx) => ({ ...tx, currency: group.currency })),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={debtRows}
        keyExtractor={(item, index) =>
          `${item.currency}-${item.fromUserId}-${item.toUserId}-${index}`
        }
        ListEmptyComponent={<Text style={styles.emptyText}>Everyone&apos;s settled up!</Text>}
        renderItem={({ item }) => (
          <View style={styles.debtRow}>
            <Text style={styles.debtText}>
              {nameById.get(item.fromUserId) ?? "Someone"} owes{" "}
              {nameById.get(item.toUserId) ?? "someone"}{" "}
              <Text style={styles.debtAmount}>{formatAmount(item.amountCents, item.currency)}</Text>
            </Text>
            <Pressable
              style={styles.button}
              onPress={() =>
                handleMarkSettled(item.currency, item.fromUserId, item.toUserId, item.amountCents)
              }
            >
              <Text style={styles.buttonText}>Mark as paid</Text>
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
  debtRow: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(1),
  },
  debtText: {
    color: theme.colors.text,
    flex: 1,
  },
  debtAmount: {
    fontWeight: "700",
  },
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: 8,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(1),
  },
  buttonText: {
    color: "#0a0a0a",
    fontWeight: "600",
    fontSize: 12,
  },
  emptyText: {
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: theme.spacing(4),
  },
});
