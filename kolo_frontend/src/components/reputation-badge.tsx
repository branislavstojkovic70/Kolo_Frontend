import { Box, LinearProgress, Stack, Tooltip, Typography } from "@mui/material";
import { formatVestingPeriod, getVestingTier } from "../utils/vesting";

interface ReputationBadgeProps {
	score: number;
	showTier?: boolean;
}

function colorFor(score: number) {
	if (score >= 81) return "success" as const;
	if (score >= 51) return "info" as const;
	if (score >= 21) return "warning" as const;
	return "error" as const;
}

export default function ReputationBadge({ score, showTier = true }: ReputationBadgeProps) {
	const tier = getVestingTier(score);

	return (
		<Box sx={{ minWidth: 180 }}>
			<Stack direction="row" sx={{ mb: 0.5, justifyContent: "space-between" }}>
				<Typography variant="caption" color="text.secondary">
					Reputation
				</Typography>
				<Typography variant="caption" sx={{ fontWeight: 600 }}>
					{score}/100
				</Typography>
			</Stack>

			<Tooltip title={`Vesting period: ${formatVestingPeriod(tier.hours)}`}>
				<LinearProgress
					variant="determinate"
					value={score}
					color={colorFor(score)}
					sx={{ height: 8, borderRadius: 4 }}
				/>
			</Tooltip>

			{showTier && (
				<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
					{tier.label} · funds vest in {formatVestingPeriod(tier.hours)}
				</Typography>
			)}
		</Box>
	);
}
