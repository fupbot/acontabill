import { desc, eq } from "drizzle-orm";

import { db } from "../db/client";
import { generateId } from "../db/ids";
import { expenses, expenseSplits } from "../db/schema";
import { computeSplits, type SplitConfig } from "./expense-splitting";

export interface ExpenseInput {
  groupId: string;
  description: string;
  amountCents: number;
  currency: string;
  date: Date;
  categoryId?: string;
  paidByUserId: string;
  split: SplitConfig;
}

export async function createExpense(input: ExpenseInput) {
  const expense = {
    id: generateId(),
    groupId: input.groupId,
    description: input.description,
    amountCents: input.amountCents,
    currency: input.currency,
    date: input.date,
    categoryId: input.categoryId,
    paidByUserId: input.paidByUserId,
    splitType: input.split.type,
    createdAt: new Date(),
  };

  const splits = computeSplits(input.amountCents, input.split);

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

export async function updateExpense(expenseId: string, input: ExpenseInput) {
  const splits = computeSplits(input.amountCents, input.split);

  await db.transaction(async (tx) => {
    await tx
      .update(expenses)
      .set({
        description: input.description,
        amountCents: input.amountCents,
        currency: input.currency,
        date: input.date,
        categoryId: input.categoryId,
        paidByUserId: input.paidByUserId,
        splitType: input.split.type,
      })
      .where(eq(expenses.id, expenseId));

    await tx.delete(expenseSplits).where(eq(expenseSplits.expenseId, expenseId));
    await tx.insert(expenseSplits).values(
      splits.map((split) => ({
        id: generateId(),
        expenseId,
        userId: split.userId,
        amountCents: split.amountCents,
      })),
    );
  });
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

/** All splits for every expense in a group — the raw material balances.ts joins against expenses to build shared-core postings. */
export function listExpenseSplitsForGroup(groupId: string) {
  return db
    .select({
      expenseId: expenseSplits.expenseId,
      userId: expenseSplits.userId,
      amountCents: expenseSplits.amountCents,
    })
    .from(expenseSplits)
    .innerJoin(expenses, eq(expenseSplits.expenseId, expenses.id))
    .where(eq(expenses.groupId, groupId));
}

export async function getExpenseWithSplits(expenseId: string) {
  const [expense] = await db.select().from(expenses).where(eq(expenses.id, expenseId)).limit(1);
  if (!expense) {
    return null;
  }
  const splits = await db
    .select()
    .from(expenseSplits)
    .where(eq(expenseSplits.expenseId, expenseId));
  return { expense, splits };
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
