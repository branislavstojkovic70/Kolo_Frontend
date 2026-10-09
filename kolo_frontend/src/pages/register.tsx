import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { SignUp } from "@clerk/clerk-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth-layout";
import { LockIcon } from "../components/icons";
import { useAuth } from "../hooks/use-auth";
import { isClerkEnabled } from "../lib/clerk";

/** Clerk owns the form when it is configured; otherwise the dev e-mail form. */
export default function Register() {
	return isClerkEnabled ? <ClerkSignUp /> : <DevSignUp />;
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

function ClerkSignUp() {
	const { user, loading } = useAuth();

	if (!loading && user) return <Navigate to="/ads" replace />;

	return (
		<AuthLayout>
			<h1 style={{ margin: "0 0 6px" }}>Create your account</h1>
			<div className="text-muted" style={{ fontSize: 15, marginBottom: 28 }}>
				Already with us? <Link to="/login">Sign in</Link> instead.
			</div>
			{/* The backend creates the Kolo row on the first /me call after sign-up. */}
			<SignUp routing="path" path="/register" signInUrl="/login" fallbackRedirectUrl="/ads" />
			<Footnote />
		</AuthLayout>
	);
}

function DevSignUp() {
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
				<h1 style={{ margin: "0 0 6px" }}>Create your account</h1>
				<div className="text-muted" style={{ fontSize: 15, marginBottom: 28 }}>
					Already with us? <Link to="/login">Sign in</Link> instead.
				</div>
				<div className="field" style={{ marginBottom: 16 }}>
					<label htmlFor="register-name">Your name</label>
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
				<div className="field" style={{ marginBottom: 16 }}>
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
				{/* Decorative: dev-bypass auth has no password. Clerk's form does. */}
				<div className="field" style={{ marginBottom: 22 }}>
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
					{submitting ? "Creating your account…" : "Create account"}
				</button>
				<Footnote />
			</form>
		</AuthLayout>
	);
}
