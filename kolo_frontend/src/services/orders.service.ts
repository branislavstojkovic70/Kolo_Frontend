import { mockOrders, mockPayments } from "../mocks/orders.mock";
import { PLATFORM_FEE_RATE, type Order, type OrderStatus, type Payment } from "../types";
import { nextId, nowIso, reject, respond } from "./api";

const orders = [...mockOrders];
const payments = [...mockPayments];

export function getOrders(userId: string): Promise<Order[]> {
	return respond(
		orders
			.filter((o) => o.buyerId === userId || o.sellerId === userId)
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
	);
}

export function getAllOrders(): Promise<Order[]> {
	return respond(orders);
}

export function getOrder(id: string): Promise<Order> {
	const order = orders.find((o) => o.id === id);
	return order ? respond(order) : reject(`Order ${id} not found`);
}

export function getPayment(orderId: string): Promise<Payment | null> {
	return respond(payments.find((p) => p.orderId === orderId) ?? null);
}

export function createOrder(
	buyerId: string,
	ad: { id: string; sellerId: string; title: string; price: number }
): Promise<Order> {
	const order: Order = {
		id: nextId("o"),
		buyerId,
		sellerId: ad.sellerId,
		adId: ad.id,
		adTitle: ad.title,
		amount: ad.price,
		feeAmount: Number((ad.price * PLATFORM_FEE_RATE).toFixed(2)),
		status: "pending_payment",
		createdAt: nowIso(),
	};

	orders.unshift(order);
	payments.push({
		id: nextId("p"),
		orderId: order.id,
		oxapayTrackId: `OXP-${Math.floor(Math.random() * 9_000_000 + 1_000_000)}`,
		currency: "USDT",
		amountPaid: 0,
		status: "waiting",
		payAddress: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
		createdAt: nowIso(),
	});

	return respond(order);
}

export function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
	const index = orders.findIndex((o) => o.id === id);
	if (index === -1) return reject(`Order ${id} not found`);

	const patch: Partial<Order> = { status };
	if (status === "delivered") patch.deliveredAt = nowIso();
	if (status === "completed") patch.completedAt = nowIso();

	orders[index] = { ...orders[index], ...patch };
	return respond(orders[index]);
}
