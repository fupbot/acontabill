import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CurrentUserContext, type CurrentUser } from "./context/CurrentUserContext";
import { db } from "./db/client";
import migrations from "./drizzle/migrations";
import { RootNavigator } from "./navigation/RootNavigator";
import { getOrCreateCurrentUser } from "./repositories/current-user";
import { theme } from "./theme";

export default function App() {
  const { success: migrationsReady, error: migrationError } = useMigrations(db, migrations);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    if (!migrationsReady) {
      return;
    }
    getOrCreateCurrentUser().then(setCurrentUser);
  }, [migrationsReady]);

  if (migrationError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Database migration failed: {migrationError.message}</Text>
      </View>
    );
  }

  if (!migrationsReady || !currentUser) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <CurrentUserContext.Provider value={currentUser}>
        <NavigationContainer
          theme={{
            ...DarkTheme,
            colors: { ...DarkTheme.colors, background: theme.colors.background },
          }}
        >
          <RootNavigator />
        </NavigationContainer>
      </CurrentUserContext.Provider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  errorText: {
    color: theme.colors.danger,
    padding: theme.spacing(2),
    textAlign: "center",
  },
});
