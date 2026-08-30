import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { applyThemeMode, loadThemeMode, ThemeModeContext, type ThemeMode } from "./theme";
import { AuthProvider } from "./components/auth-provider";
import RequireAuth from "./components/require-auth";
import Navbar from "./components/navbar";
import Login from "./pages/login";
import Register from "./pages/register";
import Ads from "./pages/ads";
import AdDetails from "./pages/ad-details";
import CreateAd from "./pages/create-ad";
import Orders from "./pages/orders";
import OrderDetails from "./pages/order-details";
import Disputes from "./pages/disputes";
import DisputeDetails from "./pages/dispute-details";
import Notifications from "./pages/notifications";
import Profile from "./pages/profile";
import Admin from "./pages/admin";
import NotFound from "./pages/not-found";

const router = createBrowserRouter([
	// Auth pages render without the navbar.
	{ path: "/login", element: <Login /> },
	{ path: "/register", element: <Register /> },

	{
		element: <RequireAuth />,
		children: [
			{
				element: <Navbar />,
				children: [
					{ path: "/", element: <Navigate to="/ads" replace /> },
					{ path: "/ads", element: <Ads /> },
					{ path: "/ads/new", element: <CreateAd /> },
					{ path: "/ads/:id", element: <AdDetails /> },
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

function Root() {
	const [mode, setMode] = useState<ThemeMode>(loadThemeMode);
	const toggleMode = () =>
		setMode((prev) => (prev === "dark" ? "light" : "dark"));

	useEffect(() => {
		applyThemeMode(mode);
	}, [mode]);

	const themeContext = useMemo(() => ({ mode, toggleMode }), [mode]);

	return (
		<ThemeModeContext.Provider value={themeContext}>
			<AuthProvider>
				<RouterProvider router={router} />
			</AuthProvider>
			<Toaster
				position="bottom-center"
				toastOptions={{
					style: {
						borderRadius: 0,
						border: "1px solid var(--color-divider)",
						background: "var(--color-surface)",
						color: "var(--color-text)",
						fontFamily: "var(--font-body)",
						fontSize: "13px",
						boxShadow: "var(--shadow-md)",
					},
					success: { iconTheme: { primary: "var(--ok)", secondary: "var(--color-bg)" } },
					error: { iconTheme: { primary: "var(--bad)", secondary: "var(--color-bg)" } },
				}}
			/>
		</ThemeModeContext.Provider>
	);
}

createRoot(document.getElementById("root")!).render(<Root />);
