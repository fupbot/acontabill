import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { generateId } from "../db/ids";
import { appSettings, users } from "../db/schema";

const SETTINGS_ROW_ID = "singleton";

/**
 * Returns this device's own user, creating both the settings row and the
 * user on first launch. There's no login yet (device identity/pairing is
 * Phase 5) — this is the one "you" record everything else (paid-by,
 * group membership) is created against until then.
 */
export async function getOrCreateCurrentUser(defaultName = "You") {
  const [settings] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.id, SETTINGS_ROW_ID))
    .limit(1);

  if (settings?.currentUserId) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, settings.currentUserId))
      .limit(1);
    if (user) {
      return user;
    }
  }

  const newUser = {
    id: generateId(),
    name: defaultName,
    createdAt: new Date(),
  };

  await db.insert(users).values(newUser);
  await db
    .insert(appSettings)
    .values({ id: SETTINGS_ROW_ID, currentUserId: newUser.id })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: { currentUserId: newUser.id },
    });

  return newUser;
}
