import { Button, Container, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
	const navigate = useNavigate();

	return (
		<Container maxWidth="sm">
			<Stack spacing={2} sx={{ py: 12, alignItems: "center", textAlign: "center" }}>
				<Typography variant="h2" sx={{ fontWeight: 700 }} color="primary.main">
					404
				</Typography>
				<Typography variant="h6">This page does not exist</Typography>
				<Typography variant="body2" color="text.secondary">
					The link may be broken, or the listing may have been removed.
				</Typography>
				<Button variant="contained" onClick={() => navigate("/ads")}>
					Back to the marketplace
				</Button>
			</Stack>
		</Container>
	);
}
