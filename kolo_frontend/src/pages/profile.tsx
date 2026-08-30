import { useAuth } from "../hooks/use-auth";
import { formatDate } from "../utils/format";

// Interim page — the full "Wallet & profile" design view replaces this shortly.
export default function Profile() {
	const { user } = useAuth();

	if (!user) return null;

	return (
		<div style={{ padding: 24 }}>
			<div className="card elev-sm" style={{ maxWidth: 480, padding: 18 }}>
				<h4 style={{ margin: 0 }}>{user.username ?? user.email}</h4>
				<div className="text-muted" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
					{user.email} · member since {formatDate(user.createdAt)}
				</div>
			</div>
		</div>
	);
}
