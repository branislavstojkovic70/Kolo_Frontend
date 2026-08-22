import { Card, CardContent, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface StatCardProps {
	label: string;
	value: string;
	hint?: string;
	icon?: ReactNode;
}

export default function StatCard({ label, value, hint, icon }: StatCardProps) {
	return (
		<Card variant="outlined" sx={{ height: "100%" }}>
			<CardContent>
				<Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
					<Typography variant="body2" color="text.secondary">
						{label}
					</Typography>
					{icon}
				</Stack>

				<Typography variant="h5" sx={{ mt: 1, fontWeight: 600 }}>
					{value}
				</Typography>

				{hint && (
					<Typography variant="caption" color="text.secondary">
						{hint}
					</Typography>
				)}
			</CardContent>
		</Card>
	);
}
