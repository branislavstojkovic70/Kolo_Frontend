/**
 * Theme plumbing — and nothing else.
 *
 * The palettes themselves live in `index.css` as two blocks of custom
 * properties. All this module does is decide which block is active, stamp
 * `data-theme` on <html>, remember the choice, and let React read it.
 *
 * **Dark is the default.** No stored preference → dark. We deliberately do not
 * consult `prefers-color-scheme`: the product has an opinion about how it looks
 * out of the box, and the toggle is right there in the topbar.
 *
 * The same decision is duplicated by a tiny inline script in `index.html` so
 * the attribute is on <html> before the first paint. If you change the storage
 * key, the default, or the chrome colours below, change it there too.
 */

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "kolo.theme";
const DEFAULT_MODE: ThemeMode = "dark";

/** Mirrors `--canvas` per theme, for <meta name="theme-color">. */
const BROWSER_CHROME: Record<ThemeMode, string> = {
	dark: "#161616",
	light: "#ffffff",
};

function isThemeMode(value: unknown): value is ThemeMode {
	return value === "dark" || value === "light";
}

/** The persisted choice, or dark when there isn't one. */
export function readStoredThemeMode(): ThemeMode {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (isThemeMode(stored)) return stored;
	} catch {
		// Private mode / blocked storage — fall through to the default.
	}
	return DEFAULT_MODE;
}

let current: ThemeMode = DEFAULT_MODE;
const listeners = new Set<() => void>();

/**
 * Stamps the scope the tokens in index.css are written for, syncs the browser
 * chrome colour, persists the choice and wakes up every `useThemeMode()`.
 * Called once on boot with no argument (restore), then by the toggle.
 */
export function applyThemeMode(mode: ThemeMode = readStoredThemeMode()): void {
	current = mode;
	document.documentElement.dataset.theme = mode;
	document
		.querySelector('meta[name="theme-color"]')
		?.setAttribute("content", BROWSER_CHROME[mode]);

	try {
		localStorage.setItem(STORAGE_KEY, mode);
	} catch {
		// Not being able to remember the choice must never break the app.
	}

	for (const listener of listeners) listener();
}

/** The active mode. Reads the module's own state, never the DOM. */
export function getThemeMode(): ThemeMode {
	return current;
}

/** Flips dark ⇄ light and persists. Returns the mode now in effect. */
export function toggleThemeMode(): ThemeMode {
	const next: ThemeMode = current === "dark" ? "light" : "dark";
	applyThemeMode(next);
	return next;
}

/** `useSyncExternalStore` subscription — see hooks/use-theme.ts. */
export function subscribeThemeMode(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
