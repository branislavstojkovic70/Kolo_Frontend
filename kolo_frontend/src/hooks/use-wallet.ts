import * as walletService from "../services/wallet.service";
import { useAsync } from "./use-async";

export function useWallet(userId: string | undefined) {
	return useAsync(
		() => (userId ? walletService.getWallet(userId) : Promise.reject(new Error("Not signed in"))),
		[userId]
	);
}

export function useVestingEntries(sellerId: string | undefined) {
	return useAsync(
		() => (sellerId ? walletService.getVestingEntries(sellerId) : Promise.resolve([])),
		[sellerId]
	);
}

export function useAllVestingEntries() {
	return useAsync(() => walletService.getAllVestingEntries(), []);
}
