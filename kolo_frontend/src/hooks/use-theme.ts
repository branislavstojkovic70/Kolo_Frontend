import { useSyncExternalStore } from "react";
import { getThemeMode, subscribeThemeMode, type ThemeMode } from "../theme";

/**
 * The active theme, for the handful of places that cannot read a CSS custom
 * property: the toggle's own icon, and Clerk's `appearance` (which parses
 * concrete hexes in JS). Everything else styles itself from the tokens and
 * needs no hook at all.
 */
export function useThemeMode(): ThemeMode {
	return useSyncExternalStore(subscribeThemeMode, getThemeMode, getThemeMode);
}
