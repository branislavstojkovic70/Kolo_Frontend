import { createContext, useContext } from "react";
import type { Credentials, RegisterPayload, User } from "../types";

export interface AuthContextValue {
	user: User | undefined;
	loading: boolean;
	isAdmin: boolean;
	isSeller: boolean;
	login: (credentials: Credentials) => Promise<void>;
	register: (payload: RegisterPayload) => Promise<void>;
	logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used inside AuthProvider");
	return context;
}
