import type { ClerkProvider } from "@clerk/clerk-react";
import type { ComponentProps } from "react";
import type { ThemeMode } from "../theme";

type Appearance = ComponentProps<typeof ClerkProvider>["appearance"];

/**
 * Clerk is opt-in. Set VITE_CLERK_PUBLISHABLE_KEY and the app switches to real
 * Clerk sessions: <SignIn>/<SignUp> for the auth screens and an
 * `Authorization: Bearer <token>` header on every API call.
 *
 * With the key empty the app falls back to the backend's DEV_AUTH_BYPASS
 * e-mail session, so the seeded demo accounts keep working.
 */
export const CLERK_PUBLISHABLE_KEY: string =
	(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)?.trim() ?? "";

export const isClerkEnabled: boolean = CLERK_PUBLISHABLE_KEY.length > 0;

/**
 * Clerk parses `variables` in JS to derive its own shades and pick readable
 * text colours, so they must be concrete values — a `var()` is unparseable.
 * This is therefore the one place in the app that duplicates palette values;
 * it mirrors the two token blocks in index.css and must be kept in step with
 * them. `elements` below is raw CSS and keeps using var().
 */
const PALETTES = {
	dark: {
		canvas: "#161616",
		surface: "#1f1f1f",
		ink: "#f5f5f5",
		muted: "#a3a3a3",
		accent: "#ff385c",
		success: "#5cb882",
		error: "#ff6b5e",
	},
	light: {
		canvas: "#ffffff",
		surface: "#ffffff",
		ink: "#222222",
		muted: "#6a6a6a",
		accent: "#ff385c",
		success: "#0f7b3f",
		error: "#c13515",
	},
} as const satisfies Record<ThemeMode, Record<string, string>>;

/** Clerk's widgets, wearing Kolo's skin for the active theme. */
export function buildClerkAppearance(mode: ThemeMode = "dark"): Appearance {
	const palette = PALETTES[mode];

	return {
		variables: {
			colorPrimary: palette.accent,
			colorBackground: palette.canvas,
			colorText: palette.ink,
			colorTextSecondary: palette.muted,
			colorInputBackground: palette.surface,
			colorInputText: palette.ink,
			colorDanger: palette.error,
			colorSuccess: palette.success,
			fontFamily: '"Inter", system-ui, sans-serif',
			fontFamilyButtons: '"Inter", system-ui, sans-serif',
			borderRadius: "8px",
		},
		elements: {
			rootBox: { width: "100%" },
			cardBox: { width: "100%", boxShadow: "none", border: "none" },
			card: {
				width: "100%",
				boxShadow: "none",
				border: "none",
				background: "transparent",
				padding: 0,
			},
			// Kolo renders its own heading above the widget.
			header: { display: "none" },
			footer: {
				background: "transparent",
				borderTop: "1px solid var(--hairline-soft)",
				marginTop: 22,
			},
			footerAction: { justifyContent: "flex-start" },
			formFieldLabel: { fontSize: 14, fontWeight: 500, color: "var(--ink)" },
			formFieldInput: {
				borderRadius: "var(--r-btn)",
				border: "1px solid var(--hairline)",
				minHeight: 48,
			},
			formButtonPrimary: {
				borderRadius: "var(--r-btn)",
				minHeight: 48,
				fontFamily: "var(--font-body)",
				fontSize: 16,
				fontWeight: 500,
				textTransform: "none",
				letterSpacing: "normal",
				boxShadow: "none",
			},
			socialButtonsBlockButton: {
				borderRadius: "var(--r-btn)",
				minHeight: 48,
				border: "1px solid var(--hairline)",
				color: "var(--ink)",
			},
			socialButtonsBlockButtonText: { color: "var(--ink)", fontWeight: 500 },
			dividerLine: { background: "var(--hairline-soft)" },
			dividerText: { fontSize: 14, color: "var(--muted)" },
			footerActionLink: { color: "var(--accent)", fontWeight: 600 },
		},
	};
}
