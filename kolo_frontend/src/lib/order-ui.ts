import type { DisputeStatus, OrderStatus, WithdrawalStatus } from "../api/types";

/**
 * Status chips. `color` is the chip's ink; StatusTag tints it down for the
 * fill. Labels are the shopper-facing wording — the API enum names never
 * reach the screen.
 */
export function orderStatusTag(status: OrderStatus): { label: string; color: string } {
	switch (status) {
		case "PENDING_PAYMENT":
			return { label: "Awaiting payment", color: "var(--caution)" };
		case "PAID":
			return { label: "Completed", color: "var(--success)" };
		case "DISPUTED":
			return { label: "In resolution", color: "var(--error)" };
		case "REFUNDED":
			return { label: "Refunded", color: "var(--muted)" };
		case "EXPIRED":
			return { label: "Expired", color: "var(--muted)" };
	}
}

export function disputeStatusTag(status: DisputeStatus): { label: string; color: string } {
	switch (status) {
		case "OPEN":
			return { label: "In review", color: "var(--caution)" };
		case "RESOLVED_BUYER":
			return { label: "Resolved for buyer", color: "var(--success)" };
		case "RESOLVED_SELLER":
			return { label: "Resolved for seller", color: "var(--success)" };
	}
}

export function withdrawalStatusTag(status: WithdrawalStatus): { label: string; color: string } {
	switch (status) {
		case "PENDING":
			return { label: "Requested", color: "var(--caution)" };
		case "PROCESSING":
			return { label: "On its way", color: "var(--accent)" };
		case "COMPLETED":
			return { label: "Paid out", color: "var(--success)" };
		case "FAILED":
			return { label: "Failed", color: "var(--error)" };
	}
}

/**
 * The 5-step protection bar: Payment → Protected → Delivered → Clearing →
 * Paid out. Steps light up from real order state; `color` is the fill for the
 * lit segments — accent while the trade is on course, red when something went
 * wrong, muted when the journey ended without a sale (refund: the bar is over,
 * not complete, so it must not read like a 5/5 success).
 */
export function protectionSteps(order: {
	status: OrderStatus;
	vestedAt: string | null;
	withdrawalId: string | null;
}): { filled: number; color: string } {
	switch (order.status) {
		case "PENDING_PAYMENT":
			return { filled: 0, color: "var(--accent)" };
		case "EXPIRED":
			return { filled: 0, color: "var(--error)" };
		case "DISPUTED":
			return { filled: 2, color: "var(--error)" };
		case "REFUNDED":
			return { filled: 5, color: "var(--muted-soft)" };
		case "PAID": {
			const vested = !!order.vestedAt && new Date(order.vestedAt).getTime() <= Date.now();
			if (order.withdrawalId) return { filled: 5, color: "var(--accent)" };
			return { filled: vested ? 4 : 3, color: "var(--accent)" };
		}
	}
}
