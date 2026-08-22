import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createAppTheme, ThemeModeContext, type ThemeMode } from "./theme";
import Navbar from "./components/navbar.tsx"


const router = createBrowserRouter([
	{
		path: "/",
		element: <Navbar/>,
		children: [
			{
				path: "/",
				// element:,
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
				<RouterProvider router={router} />
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
