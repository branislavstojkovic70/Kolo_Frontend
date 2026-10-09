import { type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/clerk-react";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { buildClerkAppearance, CLERK_PUBLISHABLE_KEY, isClerkEnabled } from "./lib/clerk";
import { applyThemeMode } from "./theme";
import { useThemeMode } from "./hooks/use-theme";
import { AuthProvider } from "./components/auth-provider";
import PlatformConfigProvider from "./components/platform-config-provider";
import RequireAuth from "./components/require-auth";
import AppShell from "./components/app-shell";
import Landing from "./pages/landing";
import Login from "./pages/login";
import Register from "./pages/register";
import Ads from "./pages/ads";
import AdDetails from "./pages/ad-details";
import CreateAd from "./pages/create-ad";
import DealAlerts from "./pages/deal-alerts";
import Orders from "./pages/orders";
import OrderDetails from "./pages/order-details";
import Disputes from "./pages/disputes";
import DisputeDetails from "./pages/dispute-details";
import Notifications from "./pages/notifications";
import Profile from "./pages/profile";
import Admin from "./pages/admin";
import NotFound from "./pages/not-found";

const router = createBrowserRouter([
	// The public landing page. It sends signed-in visitors on to /ads itself,
	// so "/" is marketing for a stranger and the app for a member.
	{ path: "/", element: <Landing /> },

	// Auth pages render without the app shell. The splat is required by Clerk's
	// path routing — it mounts sub-steps (2FA, SSO callback) under these paths.
	{ path: "/login/*", element: <Login /> },
	{ path: "/register/*", element: <Register /> },

	{
		element: <RequireAuth />,
		children: [
			{
				element: <AppShell />,
				children: [
					{ path: "/ads", element: <Ads /> },
					{ path: "/ads/new", element: <CreateAd /> },
					{ path: "/ads/:id/edit", element: <CreateAd /> },
					{ path: "/ads/:id", element: <AdDetails /> },
					{ path: "/alerts", element: <DealAlerts /> },
					{ path: "/orders", element: <Orders /> },
					{ path: "/orders/:id", element: <OrderDetails /> },
					{ path: "/disputes", element: <Disputes /> },
					{ path: "/disputes/:id", element: <DisputeDetails /> },
					{ path: "/notifications", element: <Notifications /> },
					{ path: "/profile", element: <Profile /> },
					{
						element: <RequireAuth adminOnly />,
						children: [{ path: "/admin", element: <Admin /> }],
					},
					{ path: "*", element: <NotFound /> },
				],
			},
		],
	},
]);

/**
 * Clerk wraps the tree only when a publishable key is configured — mounting
 * ClerkProvider with an empty key throws and blanks the app.
 *
 * Clerk's `appearance` needs concrete hexes (it derives its own shades in JS),
 * so unlike everything else in the app it cannot read the token sheet. It gets
 * rebuilt whenever the theme flips instead.
 */
function ClerkGate({ children }: { children: ReactNode }) {
	const mode = useThemeMode();

	if (!isClerkEnabled) return <>{children}</>;

	return (
		<ClerkProvider
			publishableKey={CLERK_PUBLISHABLE_KEY}
			afterSignOutUrl="/login"
			appearance={buildClerkAppearance(mode)}
		>
			{children}
		</ClerkProvider>
	);
}

function Root() {
	return (
		<>
			<PlatformConfigProvider>
				<ClerkGate>
					<AuthProvider>
						<RouterProvider router={router} />
					</AuthProvider>
				</ClerkGate>
			</PlatformConfigProvider>
			{/* Toasts float, so they take the card surface and the real shadow in
			    both themes. `secondary` is the glyph knocked out of the status
			    disc — it has to be the toast's own surface, not white. */}
			<Toaster
				position="bottom-center"
				/* Bottom-centre is also where the listing detail's mobile buy bar
				   lives. `--toast-bottom` is 16px everywhere except on a page that
				   has a buy bar below 1128px, where index.css lifts it clear. */
				containerStyle={{ bottom: "var(--toast-bottom)" }}
				toastOptions={{
					style: {
						borderRadius: "var(--r-btn)",
						border: "1px solid var(--hairline)",
						background: "var(--surface-card)",
						color: "var(--ink)",
						fontFamily: "var(--font-body)",
						fontSize: "15px",
						boxShadow: "var(--shadow-card)",
					},
					success: {
						iconTheme: { primary: "var(--success)", secondary: "var(--surface-card)" },
					},
					error: {
						iconTheme: { primary: "var(--error)", secondary: "var(--surface-card)" },
					},
				}}
			/>
		</>
	);
}

// index.html already stamped <html> before the first paint; this re-runs the
// same decision so the module's own state matches what is on screen.
applyThemeMode();

createRoot(document.getElementById("root")!).render(<Root />);
