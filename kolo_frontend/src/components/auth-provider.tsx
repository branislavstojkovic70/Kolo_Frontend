import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthContextValue } from "../hooks/use-auth";
import { getSessionEmail, setSessionEmail, usersApi, type User } from "../api";

/**
 * Session = the signed-in e-mail (dev-bypass auth). GET /me JIT-provisions the
 * account on the backend, so "login" and "register" are the same call — the
 * register variant additionally saves the chosen display name.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User>();
	// Only a stored session needs to resolve before the guards can decide.
	const [loading, setLoading] = useState(() => !!getSessionEmail());

	useEffect(() => {
		if (!getSessionEmail()) return;
		usersApi
			.me()
			.then(setUser)
			.catch(() => setSessionEmail(null))
			.finally(() => setLoading(false));
	}, []);

	const login = useCallback(async (email: string) => {
		setSessionEmail(email.trim().toLowerCase());
		try {
			setUser(await usersApi.me());
		} catch (error) {
			setSessionEmail(null);
			throw error;
		}
	}, []);

	const register = useCallback(async (email: string, username: string) => {
		setSessionEmail(email.trim().toLowerCase());
		try {
			await usersApi.me();
			setUser(await usersApi.updateMe({ username }));
		} catch (error) {
			setSessionEmail(null);
			throw error;
		}
	}, []);

	const logout = useCallback(() => {
		setSessionEmail(null);
		setUser(undefined);
	}, []);

	const refresh = useCallback(async () => {
		setUser(await usersApi.me());
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			loading,
			isAdmin: user?.role === "ADMIN",
			isSeller: !!user,
			login,
			register,
			logout,
			refresh,
		}),
		[user, loading, login, register, logout, refresh]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
