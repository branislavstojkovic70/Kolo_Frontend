import { Chip } from "@mui/material";
import type { AdStatus, DisputeStatus, OrderStatus, VestingStatus } from "../types";
import { humanise } from "../utils/format";

type AnyStatus = OrderStatus | DisputeStatus | AdStatus | VestingStatus;
type ChipColor = "default" | "primary" | "secondary" | "success" | "error" | "warning" | "info";

const COLORS: Record<string, ChipColor> = {
	// Orders
	pending_payment: "warning",
	paid: "info",
	in_progress: "info",
	delivered: "secondary",
	completed: "success",
	disputed: "error",
	cancelled: "default",
	refunded: "warning",
	// Disputes
	open: "warning",
	under_review: "info",
	resolved_buyer: "success",
	resolved_seller: "success",
	resolved_partial: "secondary",
	// Ads
	draft: "default",
	active: "success",
	paused: "warning",
	removed: "error",
	// Vesting
	vesting: "info",
	available: "success",
	frozen: "warning",
	slashed: "error",
};

interface StatusChipProps {
	status: AnyStatus;
	size?: "small" | "medium";
}

export default function StatusChip({ status, size = "small" }: StatusChipProps) {
	return (
		<Chip
			label={humanise(status)}
			color={COLORS[status] ?? "default"}
			size={size}
			variant="outlined"
		/>
	);
}
