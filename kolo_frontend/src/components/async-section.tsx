import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface AsyncSectionProps {
	loading: boolean;
	error?: string;
	isEmpty?: boolean;
	emptyMessage?: string;
	children: ReactNode;
}

/** Standard loading / error / empty handling so every page behaves the same way. */
export default function AsyncSection({
	loading,
	error,
	isEmpty,
	emptyMessage = "Nothing here yet.",
	children,
}: AsyncSectionProps) {
	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return <Alert severity="error">{error}</Alert>;
	}

	if (isEmpty) {
		return (
			<Stack sx={{ py: 8, alignItems: "center" }}>
				<Typography color="text.secondary">{emptyMessage}</Typography>
			</Stack>
		);
	}

	return <>{children}</>;
}
