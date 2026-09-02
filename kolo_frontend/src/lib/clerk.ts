import type { ClerkProvider } from "@clerk/clerk-react";
import type { ComponentProps } from "react";

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
 * text colours, so they must be concrete values — a `var()` is unparseable and
 * makes Clerk assume a white ground (black-on-black social buttons in dark
 * mode). Mirrors the two theme blocks in index.css; `elements` below is raw CSS
 * and can keep using var().
 */
const PALETTE = {
	dark: {
		bg: "#0a0f1a",
		surface: "#111a2b",
		text: "#e9eef7",
		muted: "#7c8fa5",
		ok: "#3ecf8e",
		bad: "#ff5c5c",
	},
	light: {
		bg: "#eef1f5",
		surface: "#ffffff",
		text: "#17263a",
		muted: "#748496",
		ok: "#1e9e63",
		bad: "#d33d2e",
	},
} as const;

const ACCENT = "#f97316";

/** Clerk's widgets, wearing Kolo's skin. Rebuilt when the theme toggles. */
export function buildClerkAppearance(mode: "dark" | "light"): Appearance {
	const c = PALETTE[mode];

	return {
		variables: {
			colorPrimary: ACCENT,
			// The auth pane shows the page ground, not the surface.
			colorBackground: c.bg,
			colorText: c.text,
			colorTextSecondary: c.muted,
			colorInputBackground: c.surface,
			colorInputText: c.text,
			colorDanger: c.bad,
			colorSuccess: c.ok,
			fontFamily: '"Archivo", system-ui, sans-serif',
			fontFamilyButtons: '"Archivo", system-ui, sans-serif',
			borderRadius: "0px",
		},
		elements: {
			rootBox: { width: "100%" },
			cardBox: { width: "100%", boxShadow: "none", border: "none", borderRadius: 0 },
			card: {
				width: "100%",
				boxShadow: "none",
				border: "none",
				background: "transparent",
				padding: 0,
			},
			// Kolo renders its own poster-style heading above the widget.
			header: { display: "none" },
			footer: {
				background: "transparent",
				borderTop: "2px solid var(--color-divider)",
				marginTop: 22,
			},
			footerAction: { justifyContent: "flex-start" },
			formFieldLabel: {
				fontFamily: "var(--font-mono)",
				fontSize: 11,
				letterSpacing: "0.1em",
				textTransform: "uppercase",
			},
			formFieldInput: { borderRadius: 0, border: "1px solid var(--color-divider)" },
			formButtonPrimary: {
				borderRadius: 0,
				fontFamily: "var(--font-body)",
				fontWeight: 700,
				textTransform: "uppercase",
				letterSpacing: "0.04em",
				boxShadow: "none",
			},
			socialButtonsBlockButton: {
				borderRadius: 0,
				border: "1px solid var(--color-divider)",
				color: "var(--color-text)",
			},
			socialButtonsBlockButtonText: { color: "var(--color-text)", fontWeight: 600 },
			dividerLine: { background: "var(--color-divider)" },
			dividerText: { fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em" },
			footerActionLink: { color: "var(--color-accent)", fontWeight: 600 },
		},
	};
}
