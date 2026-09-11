import { canManageCategories, type GroupRole } from "@acontabill/shared-core";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { generateId } from "../db/ids";
import { categories } from "../db/schema";

export function listCategories(groupId: string) {
  return db.select().from(categories).where(eq(categories.groupId, groupId));
}

export async function createCategory(groupId: string, name: string, requesterRole: GroupRole) {
  if (!canManageCategories(requesterRole)) {
    throw new Error("Only a group admin can manage categories");
  }

  const category = { id: generateId(), groupId, name, createdAt: new Date() };
  await db.insert(categories).values(category);
  return category;
}
