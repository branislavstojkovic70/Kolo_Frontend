import { VESTING_TIERS, type VestingTier } from "../types";

/** Resolves the vesting tier a seller's reputation currently falls into (spec 3.3). */
export function getVestingTier(reputationScore: number): VestingTier {
	const tier = VESTING_TIERS.find(
		(t) => reputationScore >= t.minReputation && reputationScore <= t.maxReputation
	);

	return tier ?? VESTING_TIERS[0];
}

export function formatVestingPeriod(hours: number): string {
	return hours >= 24 ? `${hours / 24} days` : `${hours} hours`;
}

export function isReleasable(releaseAt: string): boolean {
	return new Date(releaseAt).getTime() <= Date.now();
}
