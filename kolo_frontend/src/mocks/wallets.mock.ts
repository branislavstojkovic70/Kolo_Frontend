import type { VestingEntry, Wallet } from "../types";

export const mockWallets: Wallet[] = [
	{
		id: "w-001",
		userId: "u-001",
		escrowBalance: 336,
		vestingBalance: 249.6,
		availableBalance: 512.4,
	},
	{
		id: "w-002",
		userId: "u-002",
		escrowBalance: 172.8,
		vestingBalance: 403.2,
		availableBalance: 1980.5,
	},
	{
		id: "w-003",
		userId: "u-003",
		escrowBalance: 614.4,
		vestingBalance: 0,
		availableBalance: 96.2,
	},
	{
		id: "w-004",
		userId: "u-004",
		escrowBalance: 0,
		vestingBalance: 0,
		availableBalance: 0,
	},
];

export const mockVestingEntries: VestingEntry[] = [
	{
		id: "v-001",
		orderId: "o-001",
		sellerId: "u-002",
		amount: 403.2,
		releaseAt: "2026-08-25T09:55:00.000Z",
		status: "vesting",
		createdAt: "2026-08-02T09:55:00.000Z",
	},
	{
		id: "v-002",
		orderId: "o-002",
		sellerId: "u-001",
		amount: 249.6,
		releaseAt: "2026-08-24T12:00:00.000Z",
		status: "vesting",
		createdAt: "2026-08-20T12:00:00.000Z",
	},
	{
		id: "v-003",
		orderId: "o-004",
		sellerId: "u-003",
		amount: 614.4,
		releaseAt: "2026-08-30T11:20:00.000Z",
		status: "frozen",
		createdAt: "2026-08-10T11:20:00.000Z",
	},
	{
		id: "v-004",
		orderId: "o-005",
		sellerId: "u-003",
		amount: 211.2,
		releaseAt: "2026-08-15T09:00:00.000Z",
		status: "slashed",
		createdAt: "2026-08-03T09:00:00.000Z",
	},
	{
		id: "v-005",
		orderId: "o-007",
		sellerId: "u-001",
		amount: 336,
		releaseAt: "2026-08-23T07:15:00.000Z",
		status: "available",
		createdAt: "2026-08-22T07:15:00.000Z",
	},
];
