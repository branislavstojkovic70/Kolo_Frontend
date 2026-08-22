import { Box, Container, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface PageContainerProps {
	title: string;
	subtitle?: string;
	action?: ReactNode;
	children: ReactNode;
	maxWidth?: "sm" | "md" | "lg" | "xl";
}

export default function PageContainer({
	title,
	subtitle,
	action,
	children,
	maxWidth = "lg",
}: PageContainerProps) {
	return (
		<Container maxWidth={maxWidth} sx={{ py: 4 }}>
			<Stack
				direction={{ xs: "column", sm: "row" }}
				spacing={2}
				sx={{ mb: 3, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}
			>
				<Box>
					<Typography variant="h4" sx={{ fontWeight: 600 }}>
						{title}
					</Typography>
					{subtitle && (
						<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
							{subtitle}
						</Typography>
					)}
				</Box>
				{action}
			</Stack>

			{children}
		</Container>
	);
}
