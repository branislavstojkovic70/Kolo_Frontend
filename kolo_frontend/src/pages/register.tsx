import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth-layout";
import { LockIcon } from "../components/icons";
import { useAuth } from "../hooks/use-auth";

export default function Register() {
	const { user, loading, register } = useAuth();
	const navigate = useNavigate();
	const [displayName, setDisplayName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);

	if (!loading && user) return <Navigate to="/ads" replace />;

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		if (!email.trim() || !displayName.trim()) return;

		setSubmitting(true);
		try {
			await register(email, displayName.trim());
			navigate("/ads", { replace: true });
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Registration failed");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<AuthLayout>
			<form onSubmit={handleSubmit}>
				<h1
					style={{
						margin: "0 0 8px",
						fontSize: 44,
						lineHeight: 0.95,
						textTransform: "uppercase",
						letterSpacing: "-0.02em",
					}}
				>
					Create account
				</h1>
				<div className="text-muted" style={{ fontSize: 13.5, marginBottom: 26 }}>
					Already on Kolo? <Link to="/login">Sign in</Link> instead.
				</div>
				<div className="field" style={{ marginBottom: 14 }}>
					<label htmlFor="register-name">Display name</label>
					<input
						id="register-name"
						className="input"
						placeholder="How buyers and sellers see you"
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
						autoFocus
						required
						minLength={2}
					/>
				</div>
				<div className="field" style={{ marginBottom: 14 }}>
					<label htmlFor="register-email">Email</label>
					<input
						id="register-email"
						className="input"
						type="email"
						placeholder="you@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
				</div>
				<div className="field" style={{ marginBottom: 20 }}>
					<label htmlFor="register-password">Password</label>
					<input
						id="register-password"
						className="input"
						type="password"
						placeholder="••••••••"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</div>
				<button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
					{submitting ? "Creating account…" : "Create account →"}
				</button>
				<div style={{ height: 2, background: "var(--color-divider)", margin: "22px 0" }} />
				<div
					className="text-muted"
					style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12 }}
				>
					<LockIcon size={13} style={{ flex: "none", marginTop: 1 }} />
					<span>
						Protected by escrow and admin arbitration. Your funds move only when you confirm.
					</span>
				</div>
			</form>
		</AuthLayout>
	);
}
