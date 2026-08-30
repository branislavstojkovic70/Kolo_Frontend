import type { DisputeStatus, OrderStatus, WithdrawalStatus } from "../api/types";

/** Solid inverted status chips — background is the status color, ink is the page bg. */
export function orderStatusTag(status: OrderStatus): { label: string; color: string } {
	switch (status) {
		case "PENDING_PAYMENT":
			return { label: "Pending payment", color: "var(--warn)" };
		case "PAID":
			return { label: "Paid", color: "var(--ok)" };
		case "DISPUTED":
			return { label: "Disputed", color: "var(--bad)" };
		case "REFUNDED":
			return { label: "Refunded", color: "var(--color-neutral-700)" };
		case "EXPIRED":
			return { label: "Expired", color: "var(--color-neutral-600)" };
	}
}

export function disputeStatusTag(status: DisputeStatus): { label: string; color: string } {
	switch (status) {
		case "OPEN":
			return { label: "Open", color: "var(--warn)" };
		case "RESOLVED_BUYER":
			return { label: "Resolved · buyer", color: "var(--ok)" };
		case "RESOLVED_SELLER":
			return { label: "Resolved · seller", color: "var(--ok)" };
	}
}

export function withdrawalStatusTag(status: WithdrawalStatus): { label: string; color: string } {
	switch (status) {
		case "PENDING":
			return { label: "Pending", color: "var(--warn)" };
		case "PROCESSING":
			return { label: "Processing", color: "var(--color-accent)" };
		case "COMPLETED":
			return { label: "Completed", color: "var(--ok)" };
		case "FAILED":
			return { label: "Failed", color: "var(--bad)" };
	}
}

/**
 * The 5-step escrow bar: Payment → Escrow → Delivery → Vesting → Released.
 * Steps light up from real order state; a dispute paints the bar red.
 */
export function escrowSteps(order: {
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
