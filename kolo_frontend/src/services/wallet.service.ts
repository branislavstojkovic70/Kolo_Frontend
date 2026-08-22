import { mockVestingEntries, mockWallets } from "../mocks/wallets.mock";
import type { VestingEntry, Wallet } from "../types";
import { reject, respond } from "./api";

const wallets = [...mockWallets];
const vestingEntries = [...mockVestingEntries];

export function getWallet(userId: string): Promise<Wallet> {
	const wallet = wallets.find((w) => w.userId === userId);
	return wallet ? respond(wallet) : reject(`No wallet for user ${userId}`);
}

export function getVestingEntries(sellerId: string): Promise<VestingEntry[]> {
	return respond(
		vestingEntries
			.filter((v) => v.sellerId === sellerId)
			.sort((a, b) => a.releaseAt.localeCompare(b.releaseAt))
	);
}

export function getAllVestingEntries(): Promise<VestingEntry[]> {
	return respond(vestingEntries);
}

export function withdraw(userId: string, amount: number): Promise<Wallet> {
	const index = wallets.findIndex((w) => w.userId === userId);
	if (index === -1) return reject(`No wallet for user ${userId}`);
	if (amount <= 0) return reject("Enter an amount greater than zero");
	if (amount > wallets[index].availableBalance) {
		return reject("Amount exceeds your available balance");
	}

	wallets[index] = {
		...wallets[index],
		availableBalance: Number((wallets[index].availableBalance - amount).toFixed(2)),
	};
	return respond(wallets[index]);
}

/** Admin override to release or freeze a vesting entry (spec 3.6). */
export function setVestingStatus(
	id: string,
	status: VestingEntry["status"]
): Promise<VestingEntry> {
	const index = vestingEntries.findIndex((v) => v.id === id);
	if (index === -1) return reject(`Vesting entry ${id} not found`);

	vestingEntries[index] = { ...vestingEntries[index], status };
	return respond(vestingEntries[index]);
}
