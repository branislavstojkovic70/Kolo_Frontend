import { disputesApi, MAX_PAGE_SIZE, ordersApi, walletApi } from "../api";
import { shortRef } from "../utils/format";
import { fmtUsd } from "../utils/money";

/**
 * The backend has no notifications table — the inbox, the unread badge and the
 * live ticker are all derived from the caller's real orders, disputes and
 * withdrawals. Read state is tracked client-side as a last-seen timestamp.
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
	/** Uppercase mono one-liner for the ticker strip. */
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
			body: `You ordered “${order.titleSnapshot}” for ${fmtUsd(order.amountUsd)} USDT.`,
			href: `/orders/${order.id}`,
			ticker: `ORDER ${shortRef(order.id)} PLACED · ${fmtUsd(order.amountUsd)} USDT`,
		});
		if (order.paidAt) {
			events.push({
				id: `purchase-paid-${order.id}`,
				time: order.paidAt,
				title: "Payment confirmed",
				tag: "Payment",
				body: `Payment for “${order.titleSnapshot}” confirmed — delivery details are unlocked on the order.`,
				href: `/orders/${order.id}`,
				ticker: `PAYMENT CONFIRMED ${shortRef(order.id)} · ${fmtUsd(order.amountUsd)} USDT ▸ ESCROW`,
			});
		}
	}

	for (const order of sales) {
		events.push({
			id: `sale-created-${order.id}`,
			time: order.createdAt,
			title: "New order on your listing",
			tag: "Sale",
			body: `${order.buyer.username ?? "A buyer"} ordered “${order.titleSnapshot}” · ${fmtUsd(order.amountUsd)} USDT.`,
			href: `/orders/${order.id}`,
			ticker: `NEW ORDER ${shortRef(order.id)} · ${order.titleSnapshot.toUpperCase().slice(0, 32)}`,
		});
		if (order.paidAt) {
			events.push({
				id: `sale-paid-${order.id}`,
				time: order.paidAt,
				title: "Payment received",
				tag: "Escrow",
				body: `${fmtUsd(order.sellerAmountUsd)} USDT moved to escrow for “${order.titleSnapshot}” after the platform fee.`,
				href: `/orders/${order.id}`,
				ticker: `${fmtUsd(order.sellerAmountUsd)} USDT ▸ ESCROW · ${shortRef(order.id)}`,
			});
		}
		if (order.vestedAt && new Date(order.vestedAt).getTime() <= now && order.status === "PAID") {
			events.push({
				id: `sale-vested-${order.id}`,
				time: order.vestedAt,
				title: "Funds released",
				tag: "Vesting",
				body: `${fmtUsd(order.sellerAmountUsd)} USDT from “${order.titleSnapshot}” finished vesting and is withdrawable.`,
				href: "/profile",
				ticker: `VESTING RELEASED · ${fmtUsd(order.sellerAmountUsd)} USDT → AVAILABLE`,
			});
		}
	}

	for (const dispute of disputes) {
		events.push({
			id: `dispute-opened-${dispute.id}`,
			time: dispute.createdAt,
			title: "Dispute opened",
			tag: "Dispute",
			body: `“${dispute.order.titleSnapshot}” — ${dispute.reason}`,
			href: `/disputes/${dispute.id}`,
			ticker: `DISPUTE ${shortRef(dispute.id)} OPENED · ${shortRef(dispute.orderId)}`,
		});
		if (dispute.resolvedAt) {
			const winner = dispute.status === "RESOLVED_BUYER" ? "buyer" : "seller";
			events.push({
				id: `dispute-resolved-${dispute.id}`,
				time: dispute.resolvedAt,
				title: `Dispute resolved in ${winner}'s favour`,
				tag: "Dispute",
				body:
					dispute.resolutionNote ??
					`The dispute on “${dispute.order.titleSnapshot}” was decided for the ${winner}.`,
				href: `/disputes/${dispute.id}`,
				ticker: `DISPUTE ${shortRef(dispute.id)} RESOLVED · ${winner.toUpperCase()}`,
			});
		}
	}

	for (const withdrawal of withdrawals) {
		events.push({
			id: `withdrawal-${withdrawal.id}`,
			time: withdrawal.createdAt,
			title: "Withdrawal requested",
			tag: "Payout",
			body: `${fmtUsd(withdrawal.amountUsd)} ${withdrawal.currency} to ${withdrawal.address.slice(0, 10)}… via ${withdrawal.network}.`,
			href: "/profile",
			ticker: `PAYOUT ${fmtUsd(withdrawal.amountUsd)} ${withdrawal.currency} · ${withdrawal.network}`,
		});
		if (withdrawal.completedAt) {
			events.push({
				id: `withdrawal-done-${withdrawal.id}`,
				time: withdrawal.completedAt,
				title: "Payout completed",
				tag: "Payout",
				body: `${fmtUsd(withdrawal.amountUsd)} ${withdrawal.currency} arrived at your wallet.`,
				href: "/profile",
				ticker: `PAYOUT SENT · ${fmtUsd(withdrawal.amountUsd)} ${withdrawal.currency} VIA ${withdrawal.network}`,
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
export const TICKER_FALLBACK =
	"ESCROW PROTECTED · EVERY ORDER MOVES PAID → ESCROWED → VESTED → RELEASED ··· " +
	"4% FLAT FEE · NO HIDDEN CHARGES ··· 100+ CRYPTO ASSETS VIA OXAPAY ··· " +
	"ADMIN-ARBITRATED DISPUTES · EVIDENCE + CHAT ··· ";

export function buildTickerText(events: AppEvent[]): string {
	if (events.length === 0) return TICKER_FALLBACK;
	return events
		.slice(0, 8)
		.map((event) => event.ticker)
		.join(" ··· ")
		.concat(" ··· ");
}
