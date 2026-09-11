import { DEFAULT_CATEGORY_NAMES } from "@acontabill/shared-core";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { generateId } from "../db/ids";
import { categories, groupMemberships, groups, users } from "../db/schema";

export async function createGroup(name: string, creatorUserId: string) {
  const group = { id: generateId(), name, createdAt: new Date() };

  await db.transaction(async (tx) => {
    await tx.insert(groups).values(group);

    await tx.insert(groupMemberships).values({
      id: generateId(),
      groupId: group.id,
      userId: creatorUserId,
      role: "admin",
      createdAt: new Date(),
    });

    // Bundled defaults, seeded per-group so they're immediately editable —
    // see REQUIREMENTS.md §3.1 ("not a cold start") and db/schema.ts's note
    // on why categories are scoped per group rather than global.
    await tx.insert(categories).values(
      DEFAULT_CATEGORY_NAMES.map((categoryName) => ({
        id: generateId(),
        groupId: group.id,
        name: categoryName,
        createdAt: new Date(),
      })),
    );
  });

  return group;
}

export async function addMember(groupId: string, userName: string) {
  return db.transaction(async (tx) => {
    const newUser = { id: generateId(), name: userName, createdAt: new Date() };
    await tx.insert(users).values(newUser);

    await tx.insert(groupMemberships).values({
      id: generateId(),
      groupId,
      userId: newUser.id,
      role: "member",
      createdAt: new Date(),
    });

    return newUser;
  });
}

export function listGroups() {
  return db.select().from(groups);
}

export function listGroupMembers(groupId: string) {
  return db
    .select({
      userId: users.id,
      name: users.name,
      role: groupMemberships.role,
    })
    .from(groupMemberships)
    .innerJoin(users, eq(groupMemberships.userId, users.id))
    .where(eq(groupMemberships.groupId, groupId));
}
