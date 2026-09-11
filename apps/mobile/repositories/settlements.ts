import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { generateId } from "../db/ids";
import { settlements } from "../db/schema";

export interface RecordSettlementInput {
  groupId: string;
  currency: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
}

export async function recordSettlement(input: RecordSettlementInput) {
  const settlement = { id: generateId(), ...input, createdAt: new Date() };
  await db.insert(settlements).values(settlement);
  return settlement;
}

export function listSettlements(groupId: string) {
  return db.select().from(settlements).where(eq(settlements.groupId, groupId));
}
