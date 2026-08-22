import { CURRENT_USER_ID, mockUsers } from "../mocks/users.mock";
import type { Credentials, RegisterPayload, User } from "../types";
import { nextId, nowIso, reject, respond } from "./api";

const SESSION_KEY = "kolo-session-user-id";

export function getSession(): Promise<User | null> {
	const id = localStorage.getItem(SESSION_KEY);
	if (!id) return respond(null, 0);

	const user = mockUsers.find((u) => u.id === id);
	return respond(user ?? null, 0);
}

export function login({ email }: Credentials): Promise<User> {
	const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
	if (!user) return reject("No account found for that email address");
	if (user.status === "blocked") return reject("This account has been blocked");

	localStorage.setItem(SESSION_KEY, user.id);
	return respond(user);
}

export function register(payload: RegisterPayload): Promise<User> {
	const exists = mockUsers.some(
		(u) => u.email.toLowerCase() === payload.email.toLowerCase()
	);
	if (exists) return reject("An account with that email already exists");

	const user: User = {
		id: nextId("u"),
		email: payload.email,
		displayName: payload.displayName,
		role: "user",
		status: "pending_verification",
		reputationScore: 0,
		emailVerified: false,
		createdAt: nowIso(),
	};

	mockUsers.push(user);
	localStorage.setItem(SESSION_KEY, user.id);
	return respond(user);
}

export function logout(): Promise<void> {
	localStorage.removeItem(SESSION_KEY);
	return respond(undefined, 0);
}

/** Signs in the seeded demo account so the app is browsable without a backend. */
export function loginAsDemoUser(): Promise<User> {
	localStorage.setItem(SESSION_KEY, CURRENT_USER_ID);
	const user = mockUsers.find((u) => u.id === CURRENT_USER_ID)!;
	return respond(user, 0);
}
