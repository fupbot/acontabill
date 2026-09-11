export type RootStackParamList = {
  GroupsList: undefined;
  GroupDetail: { groupId: string; groupName: string };
  AddExpense: { groupId: string; expenseId?: string };
  Categories: { groupId: string };
  SettleUp: { groupId: string };
};
