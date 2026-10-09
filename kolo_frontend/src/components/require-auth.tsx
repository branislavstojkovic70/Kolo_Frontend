import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";

/** Route guard. `adminOnly` mirrors the backend AdminGuard. */
export default function RequireAuth({ adminOnly = false }: { adminOnly?: boolean }) {
	const { user, loading, isAdmin } = useAuth();
	const location = useLocation();

	if (loading) {
		return (
			<div
				className="text-muted"
				style={{
					display: "flex",
					justifyContent: "center",
					paddingTop: 120,
					fontSize: 16,
					animation: "pulseDot 1.2s ease-in-out infinite",
				}}
			>
				Loading Kolo…
			</div>
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
