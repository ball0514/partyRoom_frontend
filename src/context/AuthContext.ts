// src/context/AuthContext.ts
import { createContext, useContext } from "react";
import type { User } from "firebase/auth";

// 定義型別
export interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// 建立並導出 Context
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

// 導出 Custom Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
