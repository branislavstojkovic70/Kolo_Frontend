import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthContextValue } from "../hooks/use-auth";
import * as authService from "../services/auth.service";
import type { Credentials, RegisterPayload, User } from "../types";

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User>();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		authService
			.getSession()
			.then((session) => setUser(session ?? undefined))
			.finally(() => setLoading(false));
	}, []);

	const login = useCallback(async (credentials: Credentials) => {
		setUser(await authService.login(credentials));
	}, []);

	const register = useCallback(async (payload: RegisterPayload) => {
		setUser(await authService.register(payload));
	}, []);

	const logout = useCallback(async () => {
		await authService.logout();
		setUser(undefined);
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			loading,
			isAdmin: user?.role === "admin",
			isSeller: user?.role === "seller" || user?.role === "admin",
			login,
			register,
			logout,
		}),
		[user, loading, login, register, logout]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
