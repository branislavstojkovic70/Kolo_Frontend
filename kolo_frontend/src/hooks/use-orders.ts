import * as ordersService from "../services/orders.service";
import { useAsync } from "./use-async";

export function useOrders(userId: string | undefined) {
	return useAsync(
		() => (userId ? ordersService.getOrders(userId) : Promise.resolve([])),
		[userId]
	);
}

export function useOrder(id: string | undefined) {
	return useAsync(
		() => (id ? ordersService.getOrder(id) : Promise.reject(new Error("Missing order id"))),
		[id]
	);
}

export function useOrderPayment(orderId: string | undefined) {
	return useAsync(
		() => (orderId ? ordersService.getPayment(orderId) : Promise.resolve(null)),
		[orderId]
	);
}

export function useAllOrders() {
	return useAsync(() => ordersService.getAllOrders(), []);
}
