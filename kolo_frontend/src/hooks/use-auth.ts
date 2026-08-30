import { createContext, useContext } from "react";
import type { User } from "../api/types";

export interface AuthContextValue {
	user: User | undefined;
	loading: boolean;
	isAdmin: boolean;
	/** Every Kolo account can sell — kept for route/UI guards. */
	isSeller: boolean;
	login: (email: string) => Promise<void>;
	register: (email: string, username: string) => Promise<void>;
	logout: () => void;
	/** Re-fetches /me (e.g. after a profile update). */
	refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used inside AuthProvider");
	return context;
}
