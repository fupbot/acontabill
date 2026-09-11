import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useCurrentUser } from "../context/CurrentUserContext";
import type { RootStackParamList } from "../navigation/types";
import { createGroup, listGroups } from "../repositories/groups";
import { theme } from "../theme";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "GroupsList">;

export function GroupsListScreen({ navigation }: Props) {
  const currentUser = useCurrentUser();
  const { data: groups } = useLiveQuery(listGroups());
  const [newGroupName, setNewGroupName] = useState("");

  async function handleCreateGroup() {
    const name = newGroupName.trim();
    if (!name) {
      return;
    }
    await createGroup(name, currentUser.id);
    setNewGroupName("");
  }

  return (
    <View style={styles.container}>
      <View style={styles.newGroupRow}>
        <TextInput
          style={styles.input}
          placeholder="New group name"
          placeholderTextColor={theme.colors.textMuted}
          value={newGroupName}
          onChangeText={setNewGroupName}
          onSubmitEditing={handleCreateGroup}
        />
        <Pressable style={styles.button} onPress={handleCreateGroup}>
          <Text style={styles.buttonText}>Create</Text>
        </Pressable>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(group) => group.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No groups yet — create one above.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.groupRow}
            onPress={() =>
              navigation.navigate("GroupDetail", { groupId: item.id, groupName: item.name })
            }
          >
            <Text style={styles.groupName}>{item.name}</Text>
          </Pressable>
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
  newGroupRow: {
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
  groupRow: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  groupName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: theme.spacing(4),
  },
});
