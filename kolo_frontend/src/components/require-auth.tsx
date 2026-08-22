import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";

/** Route guard. `adminOnly` mirrors the backend RolesGuard for admin routes. */
export default function RequireAuth({ adminOnly = false }: { adminOnly?: boolean }) {
	const { user, loading, isAdmin } = useAuth();
	const location = useLocation();

	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (!user) {
		return <Navigate to="/login" state={{ from: location.pathname }} replace />;
	}

	if (adminOnly && !isAdmin) {
		return <Navigate to="/" replace />;
	}

	return <Outlet />;
}
