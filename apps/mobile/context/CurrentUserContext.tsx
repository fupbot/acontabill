import { createContext, useContext } from "react";

export interface CurrentUser {
  id: string;
  name: string;
}

export const CurrentUserContext = createContext<CurrentUser | null>(null);

export function useCurrentUser(): CurrentUser {
  const currentUser = useContext(CurrentUserContext);
  if (!currentUser) {
    throw new Error("useCurrentUser must be used within a CurrentUserContext.Provider");
  }
  return currentUser;
}
