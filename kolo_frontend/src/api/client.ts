/**
 * HTTP transport for the Kolo backend (NestJS, global prefix /api).
 *
 * Auth has two modes, decided by VITE_CLERK_PUBLISHABLE_KEY:
 *  - Clerk on  — AuthProvider registers a token getter here and every request
 *    carries `Authorization: Bearer <clerk session token>`.
 *  - Clerk off — the backend's DEV_AUTH_BYPASS is used instead: the signed-in
 *    e-mail travels in `x-dev-user-email` and the API JIT-provisions the user.
 *
 * Never both at once: the backend's guard checks the dev header first, so a
 * stray e-mail header would silently outrank a real Clerk token.
 */

const API_URL: string =
	(import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000/api";

const SESSION_KEY = "kolo-session-email";

/** Mints a fresh Clerk session token; null while signed out. */
type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

/**
 * Installed by the Clerk-backed AuthProvider. Its presence is what flips this
 * module from the dev e-mail header to bearer tokens.
 */
export function setTokenGetter(getter: TokenGetter | null): void {
	tokenGetter = getter;
}

export function getSessionEmail(): string | null {
	return localStorage.getItem(SESSION_KEY);
}

export function setSessionEmail(email: string | null): void {
	if (email) localStorage.setItem(SESSION_KEY, email);
	else localStorage.removeItem(SESSION_KEY);
}

export class ApiError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;
	}
}

type Query = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
	method?: "GET" | "POST" | "PATCH" | "DELETE";
	body?: unknown;
	query?: Query;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const url = new URL(API_URL + path, window.location.origin);
	for (const [key, value] of Object.entries(options.query ?? {})) {
		if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
	}

	const headers: Record<string, string> = {};
	if (tokenGetter) {
		const token = await tokenGetter();
		if (token) headers["Authorization"] = `Bearer ${token}`;
	} else {
		const email = getSessionEmail();
		if (email) headers["x-dev-user-email"] = email;
	}
	if (options.body !== undefined) headers["Content-Type"] = "application/json";

	let response: Response;
	try {
		response = await fetch(url, {
			method: options.method ?? "GET",
			headers,
			body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
		});
	} catch {
		throw new ApiError("Cannot reach the Kolo API — is the backend running?", 0);
	}

	const text = await response.text();
	let payload: unknown;
	try {
		payload = text ? JSON.parse(text) : undefined;
	} catch {
		payload = undefined;
	}

	if (!response.ok) {
		// Backend error contract: { statusCode, message, error } with a displayable message.
		const message =
			payload && typeof payload === "object" && "message" in payload
				? String((payload as { message: unknown }).message)
				: response.statusText || "Request failed";
		throw new ApiError(message, response.status);
	}

	return payload as T;
}

export const api = {
	get: <T>(path: string, query?: Query) => request<T>(path, { query }),
	post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
	patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
	delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
