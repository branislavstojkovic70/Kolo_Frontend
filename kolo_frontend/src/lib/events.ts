import { disputesApi, MAX_PAGE_SIZE, ordersApi, walletApi, type PlatformConfig } from "../api";
import { money } from "../utils/money";

/**
 * The backend has no notifications table — the activity list, the unread badge
 * and the strip under the topbar are all derived from the caller's real orders,
 * requests and transfers. Read state is tracked client-side as a last-seen
 * timestamp.
 *
 * The source lists are paginated, so the feed covers the most recent
 * MAX_PAGE_SIZE of each — plenty for an inbox, and it never walks every page.
 */
export interface AppEvent {
	id: string;
	/** ISO timestamp the event happened at. */
	time: string;
	title: string;
	tag: string;
	body: string;
	href: string;
	/** One-liner for the quiet strip under the topbar. */
	ticker: string;
}

const SEEN_KEY = "kolo-notifications-seen";

export async function fetchEvents(): Promise<AppEvent[]> {
	const [purchasePage, salePage, disputePage, withdrawals] = await Promise.all([
		ordersApi.purchases({ limit: MAX_PAGE_SIZE }),
		ordersApi.sales({ limit: MAX_PAGE_SIZE }),
		disputesApi.mine({ limit: MAX_PAGE_SIZE }),
		walletApi.withdrawals(),
	]);
	const purchases = purchasePage.items;
	const sales = salePage.items;
	const disputes = disputePage.items;

	const events: AppEvent[] = [];
	const now = Date.now();

	for (const order of purchases) {
		events.push({
			id: `purchase-created-${order.id}`,
			time: order.createdAt,
			title: "Order placed",
			tag: "Order",
			body: `You ordered “${order.titleSnapshot}” for ${money(order.amountUsd)}.`,
			href: `/orders/${order.id}`,
			ticker: `You ordered ${order.titleSnapshot} · ${money(order.amountUsd)}`,
		});
		if (order.paidAt) {
			events.push({
				id: `purchase-paid-${order.id}`,
				time: order.paidAt,
				title: "Payment confirmed",
				tag: "Payment",
				body: `Your payment for “${order.titleSnapshot}” went through — the access details are on the order.`,
				href: `/orders/${order.id}`,
				ticker: `Payment confirmed · ${order.titleSnapshot}`,
			});
		}
	}

	for (const order of sales) {
		events.push({
			id: `sale-created-${order.id}`,
			time: order.createdAt,
			title: "New order on your listing",
			tag: "Sale",
			body: `${order.buyer.username ?? "A buyer"} ordered “${order.titleSnapshot}” · ${money(order.amountUsd)}.`,
			href: `/orders/${order.id}`,
			ticker: `New order · ${order.titleSnapshot}`,
		});
		if (order.paidAt) {
			events.push({
				id: `sale-paid-${order.id}`,
				time: order.paidAt,
				title: "Payment received",
				tag: "Protected",
				body: `${money(order.sellerAmountUsd)} is being held for you on “${order.titleSnapshot}” after the service fee.`,
				href: `/orders/${order.id}`,
				ticker: `${money(order.sellerAmountUsd)} held for you · ${order.titleSnapshot}`,
			});
		}
		if (order.vestedAt && new Date(order.vestedAt).getTime() <= now && order.status === "PAID") {
			events.push({
				id: `sale-vested-${order.id}`,
				time: order.vestedAt,
				title: "Money ready to withdraw",
				tag: "Cleared",
				body: `${money(order.sellerAmountUsd)} from “${order.titleSnapshot}” has finished clearing.`,
				href: "/profile",
				ticker: `${money(order.sellerAmountUsd)} is ready to withdraw`,
			});
		}
	}

	for (const dispute of disputes) {
		events.push({
			id: `dispute-opened-${dispute.id}`,
			time: dispute.createdAt,
			title: "Help requested on an order",
			tag: "Resolution",
			body: `“${dispute.order.titleSnapshot}” — ${dispute.reason}`,
			href: `/disputes/${dispute.id}`,
			ticker: `Help requested · ${dispute.order.titleSnapshot}`,
		});
		if (dispute.resolvedAt) {
			const winner = dispute.status === "RESOLVED_BUYER" ? "buyer" : "seller";
			events.push({
				id: `dispute-resolved-${dispute.id}`,
				time: dispute.resolvedAt,
				title: `Resolved in the ${winner}'s favour`,
				tag: "Resolution",
				body:
					dispute.resolutionNote ??
					`The request on “${dispute.order.titleSnapshot}” was decided for the ${winner}.`,
				href: `/disputes/${dispute.id}`,
				ticker: `Request resolved for the ${winner}`,
			});
		}
	}

	for (const withdrawal of withdrawals) {
		events.push({
			id: `withdrawal-${withdrawal.id}`,
			time: withdrawal.createdAt,
			title: "Transfer requested",
			tag: "Transfer",
			body: `${money(withdrawal.amountUsd)} on its way to your account.`,
			href: "/profile",
			ticker: `Transfer requested · ${money(withdrawal.amountUsd)}`,
		});
		if (withdrawal.completedAt) {
			events.push({
				id: `withdrawal-done-${withdrawal.id}`,
				time: withdrawal.completedAt,
				title: "Transfer complete",
				tag: "Transfer",
				body: `${money(withdrawal.amountUsd)} arrived in your account.`,
				href: "/profile",
				ticker: `${money(withdrawal.amountUsd)} paid out`,
			});
		}
	}

	return events.sort((a, b) => b.time.localeCompare(a.time));
}

export function getLastSeen(): string {
	return localStorage.getItem(SEEN_KEY) ?? "1970-01-01T00:00:00.000Z";
}

export function markAllSeen(): void {
	localStorage.setItem(SEEN_KEY, new Date().toISOString());
}

export function countUnread(events: AppEvent[]): number {
	const seen = getLastSeen();
	return events.filter((event) => event.time > seen).length;
}

/** Fallback strip while events load (or for a brand-new account). */
export function tickerFallback(platform: PlatformConfig | undefined): string {
	return (
		"Every order is covered by Buyer Protection · " +
		(platform ? `${platform.feePercent}% service fee, nothing hidden · ` : "") +
		"Your payment is held until you've checked your order · " +
		"Real people settle anything that goes wrong · "
	);
}

export function buildTickerText(
	events: AppEvent[],
	platform: PlatformConfig | undefined
): string {
	if (events.length === 0) return tickerFallback(platform);
	return events
		.slice(0, 8)
		.map((event) => event.ticker)
		.join(" · ")
		.concat(" · ");
}
