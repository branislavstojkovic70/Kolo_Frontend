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
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/use-auth";
import { navy } from "../theme";

export default function Register() {
	const navigate = useNavigate();
	const { register } = useAuth();

	const [displayName, setDisplayName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string>();
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();

		if (password !== confirm) {
			setError("Passwords do not match");
			return;
		}
		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}

		setSubmitting(true);
		setError(undefined);

		try {
			await register({ email, password, displayName });
			toast.success("Account created. Verify your email to start selling.");
			navigate("/", { replace: true });
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Could not create your account");
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
				py: 4,
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
							Create your account
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
							Buy services right away. Verify your email and add a payout wallet to sell.
						</Typography>

						{error && (
							<Alert severity="error" sx={{ mb: 2 }}>
								{error}
							</Alert>
						)}

						<Box component="form" onSubmit={handleSubmit}>
							<Stack spacing={2}>
								<TextField
									label="Display name"
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									required
									fullWidth
								/>
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
									helperText="At least 8 characters"
									required
									fullWidth
								/>
								<TextField
									label="Confirm password"
									type="password"
									value={confirm}
									onChange={(e) => setConfirm(e.target.value)}
									required
									fullWidth
								/>

								<Button type="submit" variant="contained" size="large" disabled={submitting}>
									{submitting ? "Creating account..." : "Create account"}
								</Button>
							</Stack>
						</Box>

						<Divider sx={{ my: 3 }} />

						<Typography variant="body2" color="text.secondary" align="center">
							Already have an account?{" "}
							<MuiLink component={Link} to="/login">
								Sign in
							</MuiLink>
						</Typography>
					</CardContent>
				</Card>
			</Container>
		</Box>
	);
}
