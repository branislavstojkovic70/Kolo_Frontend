import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { SignIn } from "@clerk/clerk-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth-layout";
import { LockIcon } from "../components/icons";
import { useAuth } from "../hooks/use-auth";
import { isClerkEnabled } from "../lib/clerk";

/** Clerk owns the form when it is configured; otherwise the dev e-mail form. */
export default function Login() {
	return isClerkEnabled ? <ClerkSignIn /> : <DevSignIn />;
}

function Footnote() {
	return (
		<>
			<div style={{ height: 1, background: "var(--hairline-soft)", margin: "24px 0" }} />
			<div
				className="text-muted"
				style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13 }}
			>
				<LockIcon size={14} style={{ flex: "none", marginTop: 2 }} />
				<span style={{ minWidth: 0 }}>
					Every order is covered by Buyer Protection. Your money only moves once you're happy.
				</span>
			</div>
		</>
	);
}

function ClerkSignIn() {
	const { user, loading } = useAuth();
	const location = useLocation();
	const from = (location.state as { from?: string } | null)?.from ?? "/ads";

	if (!loading && user) return <Navigate to={from} replace />;

	return (
		<AuthLayout>
			<h1 style={{ margin: "0 0 6px" }}>Welcome back</h1>
			<div className="text-muted" style={{ fontSize: 15, marginBottom: 28 }}>
				New here? <Link to="/register">Create an account</Link>, it takes a minute.
			</div>
			{/* routing="path" needs the /login/* splat route in main.tsx */}
			<SignIn routing="path" path="/login" signUpUrl="/register" fallbackRedirectUrl={from} />
			<Footnote />
		</AuthLayout>
	);
}

function DevSignIn() {
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
				<h1 style={{ margin: "0 0 6px" }}>Welcome back</h1>
				<div className="text-muted" style={{ fontSize: 15, marginBottom: 28 }}>
					New here? <Link to="/register">Create an account</Link>, it takes a minute.
				</div>
				<div className="field" style={{ marginBottom: 16 }}>
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
				{/* Decorative: dev-bypass auth has no password. Clerk's form does. */}
				<div className="field" style={{ marginBottom: 10 }}>
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
					<a href="#" style={{ fontSize: 14 }} onClick={(e) => e.preventDefault()}>
						Forgot your password?
					</a>
				</div>
				<button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
					{submitting ? "Signing in…" : "Sign in"}
				</button>
				<Footnote />
			</form>
		</AuthLayout>
	);
}
