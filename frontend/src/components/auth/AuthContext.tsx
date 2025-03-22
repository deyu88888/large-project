/* eslint-disable react-refresh/only-export-components */
import { useContext, createContext } from "react";

import { AxiosResponse } from "axios";
import { UseMutationResult, UseQueryResult } from "react-query";

export type AuthContextProps = {
  currentSessionQuery: UseQueryResult<AxiosResponse<any, any>, unknown>;
  logoutMutation: UseMutationResult<void, unknown, void, unknown>;
};

// ------------------------------------------------

export const AuthContext = createContext<AuthContextProps | null>(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context)
    throw new Error("useAuthContext must be use inside AuthProvider");

  return context;
};
