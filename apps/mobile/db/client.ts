import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

import * as schema from "./schema";

// enableChangeListener is what powers Drizzle's useLiveQuery hook — it makes
// expo-sqlite emit an event on every write so screens can re-run their
// queries automatically instead of us wiring manual refresh logic.
const expoDb = openDatabaseSync("acontabill.db", { enableChangeListener: true });

export const db = drizzle(expoDb, { schema });
