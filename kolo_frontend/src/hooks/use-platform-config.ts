import { createContext, useContext } from "react";
import type { PlatformConfig } from "../api";

/**
 * Fee percentage, vesting length, dispute window and payout options all live in
 * the backend env. The app reads them once at boot and every screen renders
 * from that — no constant in the frontend is allowed to restate a platform rule.
 *
 * `undefined` means "not loaded yet"; screens show a dash rather than a guess.
 */
export const PlatformConfigContext = createContext<PlatformConfig | undefined>(undefined);

export function usePlatformConfig(): PlatformConfig | undefined {
	return useContext(PlatformConfigContext);
}

/** "4%" / "—" — the fee label, never a hardcoded number. */
export function feeLabel(config: PlatformConfig | undefined): string {
	return config ? `${config.feePercent}%` : "—";
}

/** Fee on a preview price. Real orders always carry the backend's own feeUsd. */
export function previewFee(config: PlatformConfig | undefined, price: number): number {
	if (!config) return 0;
	return (price * config.feePercent) / 100;
}
