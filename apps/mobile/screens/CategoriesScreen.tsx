import { canManageCategories, type GroupRole } from "@acontabill/shared-core";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useCurrentUser } from "../context/CurrentUserContext";
import type { RootStackParamList } from "../navigation/types";
import { createCategory, listCategories } from "../repositories/categories";
import { listGroupMembers } from "../repositories/groups";
import { theme } from "../theme";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "Categories">;

export function CategoriesScreen({ route }: Props) {
  const { groupId } = route.params;
  const currentUser = useCurrentUser();
  const { data: categories } = useLiveQuery(listCategories(groupId));
  const { data: members } = useLiveQuery(listGroupMembers(groupId));
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const myRole: GroupRole =
    members?.find((member) => member.userId === currentUser.id)?.role ?? "member";
  const canManage = canManageCategories(myRole);

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      return;
    }
    try {
      await createCategory(groupId, name, myRole);
      setNewCategoryName("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add category");
    }
  }

  return (
    <View style={styles.container}>
      {canManage && (
        <View style={styles.newCategoryRow}>
          <TextInput
            style={styles.input}
            placeholder="New category name"
            placeholderTextColor={theme.colors.textMuted}
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            onSubmitEditing={handleAddCategory}
          />
          <Pressable style={styles.button} onPress={handleAddCategory}>
            <Text style={styles.buttonText}>Add</Text>
          </Pressable>
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={categories}
        keyExtractor={(category) => category.id}
        renderItem={({ item }) => (
          <View style={styles.categoryRow}>
            <Text style={styles.categoryName}>{item.name}</Text>
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
  newCategoryRow: {
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
  errorText: {
    color: theme.colors.danger,
    marginBottom: theme.spacing(1),
  },
  categoryRow: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
  },
  categoryName: {
    color: theme.colors.text,
  },
});
