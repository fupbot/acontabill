import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AddExpenseScreen } from "../screens/AddExpenseScreen";
import { CategoriesScreen } from "../screens/CategoriesScreen";
import { GroupDetailScreen } from "../screens/GroupDetailScreen";
import { GroupsListScreen } from "../screens/GroupsListScreen";
import { SettleUpScreen } from "../screens/SettleUpScreen";
import { theme } from "../theme";

import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="GroupsList"
        component={GroupsListScreen}
        options={{ title: "A conta, Bill!" }}
      />
      <Stack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={({ route }) => ({ title: route.params.groupName })}
      />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={({ route }) => ({
          title: route.params.expenseId ? "Edit expense" : "Add expense",
        })}
      />
      <Stack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ title: "Categories" }}
      />
      <Stack.Screen name="SettleUp" component={SettleUpScreen} options={{ title: "Settle up" }} />
    </Stack.Navigator>
  );
}
