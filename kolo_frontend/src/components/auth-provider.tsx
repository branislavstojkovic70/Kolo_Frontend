import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import toast from "react-hot-toast";
import { useAuth as useClerkSession } from "@clerk/clerk-react";
import { AuthContext, type AuthContextValue } from "../hooks/use-auth";
import {
	ApiError,
	getSessionEmail,
	setSessionEmail,
	setTokenGetter,
	usersApi,
	type User,
} from "../api";
import { isClerkEnabled } from "../lib/clerk";

/**
 * Two session models behind one context:
 *
 *  - Clerk (VITE_CLERK_PUBLISHABLE_KEY set) — the real thing. Clerk owns the
 *    credentials; we only exchange its token for our /me row.
 *  - Dev bypass (key empty) — the e-mail is the session, matching the
 *    backend's DEV_AUTH_BYPASS so the seeded demo accounts still work.
 *
 * `isClerkEnabled` is a module constant, so the branch never flips at runtime
 * and the two providers never trade hook order.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
	return isClerkEnabled ? (
		<ClerkAuthProvider>{children}</ClerkAuthProvider>
	) : (
		<DevAuthProvider>{children}</DevAuthProvider>
	);
}

const managedByClerk = () => {
	throw new Error("Sign-in is handled by Clerk's own form");
};

function ClerkAuthProvider({ children }: { children: ReactNode }) {
	const { isLoaded, isSignedIn, userId, getToken, signOut } = useClerkSession();
	// Tagged with the Clerk user it was fetched for, so switching accounts can
	// never show the previous one's row while the new /me is in flight.
	const [row, setRow] = useState<{ clerkUserId: string; user?: User }>();

	// getToken is re-created on every Clerk render; the ref keeps the getter we
	// hand to the API client stable while always calling the current one.
	const getTokenRef = useRef(getToken);
	useEffect(() => {
		getTokenRef.current = getToken;
	}, [getToken]);

	// Must be registered before the /me effect below fires — same component, so
	// effect order is declaration order.
	useEffect(() => {
		setTokenGetter(() => getTokenRef.current());
		return () => setTokenGetter(null);
	}, []);

	useEffect(() => {
		if (!isLoaded || !isSignedIn || !userId) return;

		let cancelled = false;
		// First call for a new Clerk account JIT-provisions the row server-side.
		usersApi
			.me()
			.then((me) => {
				if (!cancelled) setRow({ clerkUserId: userId, user: me });
			})
			.catch((error: unknown) => {
				if (cancelled) return;
				// A 401 here means Clerk signed the user in but the API refused the
				// token — almost always a CLERK_SECRET_KEY from a different Clerk
				// instance. Say so, instead of blaming the sign-in.
				const rejected = error instanceof ApiError && error.statusCode === 401;
				toast.error(
					rejected
						? "Signed in with Clerk, but the API rejected the token — check CLERK_SECRET_KEY on the backend"
						: error instanceof Error
							? error.message
							: "Could not load your account"
				);
				// A valid Clerk session with no Kolo row would bounce between
				// RequireAuth and /login forever — end the session instead.
				void signOut();
			});
		return () => {
			cancelled = true;
		};
	}, [isLoaded, isSignedIn, userId, signOut]);

	const current = userId && row?.clerkUserId === userId ? row : undefined;
	const user = isSignedIn ? current?.user : undefined;
	const loading = !isLoaded || (!!isSignedIn && !current);

	const logout = useCallback(() => {
		// isSignedIn flips to false, which clears `user` on its own.
		void signOut();
	}, [signOut]);

	const refresh = useCallback(async () => {
		const me = await usersApi.me();
		if (userId) setRow({ clerkUserId: userId, user: me });
	}, [userId]);

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			loading,
			isAdmin: user?.role === "ADMIN",
			isSeller: !!user,
			login: managedByClerk,
			register: managedByClerk,
			logout,
			refresh,
		}),
		[user, loading, logout, refresh]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Session = the signed-in e-mail (dev-bypass auth). GET /me JIT-provisions the
 * account on the backend, so "login" and "register" are the same call — the
 * register variant additionally saves the chosen display name.
 */
function DevAuthProvider({ children }: { children: ReactNode }) {
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
