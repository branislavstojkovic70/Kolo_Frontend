import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createAppTheme, ThemeModeContext, type ThemeMode } from "./theme";
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
	const [mode, setMode] = useState<ThemeMode>("dark");
	const theme = useMemo(() => createAppTheme(mode), [mode]);
	const toggleMode = () =>
		setMode((prev) => (prev === "dark" ? "light" : "dark"));

	return (
		<ThemeModeContext.Provider value={{ mode, toggleMode }}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<AuthProvider>
					<RouterProvider router={router} />
				</AuthProvider>
				<Toaster
					position="bottom-center"
					toastOptions={{
						success: {
							style: {
								background: theme.palette.success.main,
							},
						},
						error: {
							style: {
								background: theme.palette.error.main,
								color: "#F5F5F5",
							},
						},
					}}
				/>
			</ThemeProvider>
		</ThemeModeContext.Provider>
	);
}

createRoot(document.getElementById("root")!).render(<Root />);
