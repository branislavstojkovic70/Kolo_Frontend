import type { ReactNode } from "react";
import { listingsApi } from "../api";
import { useAsync } from "../hooks/use-async";
import { feeLabel, usePlatformConfig } from "../hooks/use-platform-config";
import { LockIcon, MessageIcon, ShieldCheckIcon } from "./icons";
import ThemeToggle from "./theme-toggle";

/**
 * Split sign-in screen: a calm neutral panel on the left with the three
 * promises, the form centred on the page ground on the right. The theme switch
 * sits in the form pane's corner so the choice can be made before signing in.
 * The live service count is real.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
	const { data: listings } = useAsync(() => listingsApi.list({ limit: 1 }), []);
	const platform = usePlatformConfig();

	const promises = [
		{
			icon: <ShieldCheckIcon size={18} />,
			text: "Buyer Protection on every order — a full refund if it isn't as described.",
		},
		{
			icon: <LockIcon size={18} />,
			text: "We hold the payment until you've checked what you bought.",
		},
		{
			icon: <MessageIcon size={18} />,
			text: "A real person steps in if you and the seller can't agree.",
		},
	];

	return (
		<div className="auth-split">
			<div
				className="auth-poster"
				style={{
					flex: 1.1,
					/* `min-width: 0` / `min-height: 0`: without them a flex item refuses to
					   shrink below its content, which is what pushes the split wider than a
					   narrow desktop window and clips the poster on a short one. */
					minWidth: 0,
					minHeight: 0,
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					gap: "clamp(20px, 3vh, 32px)",
					padding: "clamp(24px, 3.4vw, 48px)",
					overflowY: "auto",
					background: "var(--surface-soft)",
				}}
			>
				<div>
					<div style={{ fontSize: 26, fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}>
						Kolo
					</div>
					<div className="text-muted" style={{ fontSize: 14, marginTop: 6 }}>
						Subscriptions below retail
					</div>
				</div>

				<div>
					<h1
						style={{ fontSize: "clamp(28px, 3.4vw, 40px)", margin: 0, maxWidth: "min(22ch, 100%)" }}
					>
						Pay less for the subscriptions you already use.
					</h1>
					<p
						style={{
							fontSize: "clamp(15px, 1.4vw, 17px)",
							marginTop: 16,
							maxWidth: "min(46ch, 100%)",
						}}
					>
						Buy a verified subscription from someone with spare capacity — and keep the safety net
						of a shop while you do it.
					</p>
					<div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 28 }}>
						{promises.map((promise) => (
							<div key={promise.text} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
								<span className="text-muted" style={{ flex: "none", marginTop: 2 }}>
									{promise.icon}
								</span>
								<span
									style={{
										fontSize: 15,
										color: "var(--body-soft)",
										maxWidth: "min(44ch, 100%)",
										minWidth: 0,
									}}
								>
									{promise.text}
								</span>
							</div>
						))}
					</div>
				</div>

				<div className="text-muted" style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 14 }}>
					{listings && <span>{listings.total} subscriptions on sale</span>}
					<span>{feeLabel(platform)} service fee</span>
					<span>No subscription of our own</span>
				</div>
			</div>
			<div
				className="auth-pane"
				style={{
					flex: 1,
					minWidth: 0,
					minHeight: 0,
					position: "relative",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					padding: "clamp(32px, 4vw, 48px) clamp(20px, 3vw, 40px)",
					overflowY: "auto",
					background: "var(--canvas)",
				}}
			>
				<div style={{ position: "absolute", top: 20, right: 20 }}>
					<ThemeToggle />
				</div>
				{/* `margin: auto 0` keeps the form centred while it fits and lets it scroll
				    from the top once it doesn't — `justify-content: center` alone would
				    clip the heading off the top of a short pane. */}
				<div style={{ maxWidth: 380, width: "100%", minWidth: 0, margin: "auto 0" }}>
					{children}
				</div>
			</div>
		</div>
	);
}
