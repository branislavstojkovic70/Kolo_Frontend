export type VestingStatus = "vesting" | "available" | "frozen" | "slashed";

export interface Wallet {
	id: string;
	userId: string;
	escrowBalance: number;
	vestingBalance: number;
	availableBalance: number;
}

export interface VestingEntry {
	id: string;
	orderId: string;
	sellerId: string;
	amount: number;
	releaseAt: string;
	status: VestingStatus;
	createdAt: string;
}

export interface VestingTier {
	label: string;
	minReputation: number;
	maxReputation: number;
	/** Vesting period in hours. */
	hours: number;
}

/** Reputation -> vesting period tiers (spec 3.3). */
export const VESTING_TIERS: VestingTier[] = [
	{ label: "New / unproven", minReputation: 0, maxReputation: 20, hours: 24 * 14 },
	{ label: "Building trust", minReputation: 21, maxReputation: 50, hours: 24 * 7 },
	{ label: "Trusted", minReputation: 51, maxReputation: 80, hours: 24 * 3 },
	{ label: "Top rated", minReputation: 81, maxReputation: 100, hours: 24 },
];
