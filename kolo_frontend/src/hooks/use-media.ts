import { useSyncExternalStore } from "react";

/**
 * True while the media query matches, re-rendering on change. Used where a
 * layout genuinely needs different MARKUP per breakpoint (the disputes
 * master-detail) — pure sizing stays in CSS.
 */
export function useMediaQuery(query: string): boolean {
	return useSyncExternalStore(
		(notify) => {
			const mql = window.matchMedia(query);
			mql.addEventListener("change", notify);
			return () => mql.removeEventListener("change", notify);
		},
		() => window.matchMedia(query).matches
	);
}

/** The app's "the sidebar is a drawer" breakpoint, shared with index.css. */
export function useIsNarrow(): boolean {
	return useMediaQuery("(max-width: 1127.98px)");
}
