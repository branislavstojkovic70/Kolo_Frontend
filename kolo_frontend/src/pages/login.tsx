import { useState, type FormEvent } from "react";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Container,
	Divider,
	Link as MuiLink,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/use-auth";
import { navy } from "../theme";

export default function Login() {
	const navigate = useNavigate();
	const location = useLocation();
	const { login } = useAuth();

	const [email, setEmail] = useState("branislav@kolo.dev");
	const [password, setPassword] = useState("demo1234");
	const [error, setError] = useState<string>();
	const [submitting, setSubmitting] = useState(false);

	const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setSubmitting(true);
		setError(undefined);

		try {
			await login({ email, password });
			toast.success("Welcome back");
			navigate(redirectTo, { replace: true });
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Could not sign you in");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Box
			sx={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				background: `linear-gradient(160deg, ${navy} 0%, #0B192C 60%, #000000 100%)`,
			}}
		>
			<Container maxWidth="sm">
				<Stack sx={{ mb: 3, alignItems: "center" }}>
					<Box component="img" src="/logo.png" alt="Kolo" sx={{ height: 72 }} />
				</Stack>

				<Card variant="outlined">
					<CardContent sx={{ p: 4 }}>
						<Typography variant="h5" sx={{ fontWeight: 600 }}>
							Sign in
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
							Access your orders, disputes and payouts.
						</Typography>

						{error && (
							<Alert severity="error" sx={{ mb: 2 }}>
								{error}
							</Alert>
						)}

						<Box component="form" onSubmit={handleSubmit}>
							<Stack spacing={2}>
								<TextField
									label="Email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									fullWidth
								/>
								<TextField
									label="Password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									fullWidth
								/>

								<Button type="submit" variant="contained" size="large" disabled={submitting}>
									{submitting ? "Signing in..." : "Sign in"}
								</Button>
							</Stack>
						</Box>

						<Divider sx={{ my: 3 }} />

						<Typography variant="body2" color="text.secondary" align="center">
							No account yet?{" "}
							<MuiLink component={Link} to="/register">
								Create one
							</MuiLink>
						</Typography>

						<Alert severity="info" sx={{ mt: 3 }}>
							Demo build: any password works for a seeded account, e.g.{" "}
							<strong>branislav@kolo.dev</strong> (seller) or <strong>admin@kolo.dev</strong>{" "}
							(admin).
						</Alert>
					</CardContent>
				</Card>
			</Container>
		</Box>
	);
}
