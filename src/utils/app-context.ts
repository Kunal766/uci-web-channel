import { createContext } from "react";
import { toChangeCurrentUser, User } from "../types";

type AppContextType = {
  toChangeCurrentUser: toChangeCurrentUser;
  currentUser: User;
  allUsers: Array<User>;
} | any;

export const AppContext = createContext<AppContextType | null>(null);
