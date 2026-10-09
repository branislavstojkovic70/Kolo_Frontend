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
 * Paid out. Steps light up from real order state; a problem paints it red.
 */
export function protectionSteps(order: {
	status: OrderStatus;
	vestedAt: string | null;
	withdrawalId: string | null;
}): { filled: number; bad: boolean } {
	switch (order.status) {
		case "PENDING_PAYMENT":
			return { filled: 0, bad: false };
		case "EXPIRED":
			return { filled: 0, bad: true };
		case "DISPUTED":
			return { filled: 2, bad: true };
		case "REFUNDED":
			return { filled: 5, bad: false };
		case "PAID": {
			const vested = !!order.vestedAt && new Date(order.vestedAt).getTime() <= Date.now();
			if (order.withdrawalId) return { filled: 5, bad: false };
			return { filled: vested ? 4 : 3, bad: false };
		}
	}
}
