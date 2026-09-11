import { splitExpenseEqually } from "@acontabill/shared-core";
import { desc, eq } from "drizzle-orm";

import { db } from "../db/client";
import { generateId } from "../db/ids";
import { expenses, expenseSplits } from "../db/schema";

export interface CreateExpenseInput {
  groupId: string;
  description: string;
  amountCents: number;
  currency: string;
  date: Date;
  categoryId?: string;
  paidByUserId: string;
  participantUserIds: string[];
}

export async function createExpense(input: CreateExpenseInput) {
  const expense = {
    id: generateId(),
    groupId: input.groupId,
    description: input.description,
    amountCents: input.amountCents,
    currency: input.currency,
    date: input.date,
    categoryId: input.categoryId,
    paidByUserId: input.paidByUserId,
    splitType: "equal" as const,
    createdAt: new Date(),
  };

  const splits = splitExpenseEqually(input.amountCents, input.participantUserIds);

  await db.transaction(async (tx) => {
    await tx.insert(expenses).values(expense);
    await tx.insert(expenseSplits).values(
      splits.map((split) => ({
        id: generateId(),
        expenseId: expense.id,
        userId: split.userId,
        amountCents: split.amountCents,
      })),
    );
  });

  return expense;
}

export function listExpenses(groupId: string) {
  return db
    .select()
    .from(expenses)
    .where(eq(expenses.groupId, groupId))
    .orderBy(desc(expenses.date));
}

export function listExpenseSplits(expenseId: string) {
  return db.select().from(expenseSplits).where(eq(expenseSplits.expenseId, expenseId));
}

export async function deleteExpense(expenseId: string) {
  // Any member can delete any expense — REQUIREMENTS.md §3 (Splitwise's
  // trust-based behavior, no per-expense ownership lock). No role check
  // needed; see shared-core/src/permissions/roles.ts:canEditOrDeleteExpense.
  await db.transaction(async (tx) => {
    await tx.delete(expenseSplits).where(eq(expenseSplits.expenseId, expenseId));
    await tx.delete(expenses).where(eq(expenses.id, expenseId));
  });
}
