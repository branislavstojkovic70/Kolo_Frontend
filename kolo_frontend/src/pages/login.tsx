import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth-layout";
import { LockIcon } from "../components/icons";
import { useAuth } from "../hooks/use-auth";

export default function Login() {
	const { user, loading, login } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const from = (location.state as { from?: string } | null)?.from ?? "/ads";

	if (!loading && user) return <Navigate to={from} replace />;

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		if (!email.trim()) return;

		setSubmitting(true);
		try {
			await login(email);
			navigate(from, { replace: true });
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Sign in failed");
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
					Sign in
				</h1>
				<div className="text-muted" style={{ fontSize: 13.5, marginBottom: 26 }}>
					New here? <Link to="/register">Create an account</Link> · it takes a minute.
				</div>
				<div className="field" style={{ marginBottom: 14 }}>
					<label htmlFor="login-email">Email</label>
					<input
						id="login-email"
						className="input"
						type="email"
						placeholder="you@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						autoFocus
						required
					/>
				</div>
				<div className="field" style={{ marginBottom: 8 }}>
					<label htmlFor="login-password">Password</label>
					<input
						id="login-password"
						className="input"
						type="password"
						placeholder="••••••••"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</div>
				<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
					<a href="#" style={{ fontSize: 12 }} onClick={(e) => e.preventDefault()}>
						Forgot password?
					</a>
				</div>
				<button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
					{submitting ? "Signing in…" : "Sign in →"}
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
