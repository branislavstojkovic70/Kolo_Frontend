import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ordersApi, type Order } from "../api";
import AsyncPanel from "../components/async-panel";
import Page from "../components/page";
import StatusTag from "../components/status-tag";
import { useAsync } from "../hooks/use-async";
import { escrowSteps, orderStatusTag } from "../lib/order-ui";
import { formatDate } from "../utils/format";
import { fmtUsd, sumUsd } from "../utils/money";

type Tab = "all" | "buying" | "selling";

interface Row extends Order {
	role: "Buyer" | "Seller";
}

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)" };
const muted15 = "color-mix(in srgb, var(--color-text) 15%, transparent)";

export default function Orders() {
	const navigate = useNavigate();
	const [tab, setTab] = useState<Tab>("all");

	const { data, loading, error } = useAsync(async () => {
		const [purchases, sales] = await Promise.all([ordersApi.purchases(), ordersApi.sales()]);
		const rows: Row[] = [
			...purchases.map((o) => ({ ...o, role: "Buyer" as const })),
			...sales.map((o) => ({ ...o, role: "Seller" as const })),
		];
		return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	}, []);

	const rows = useMemo(() => {
		const all = data ?? [];
		if (tab === "buying") return all.filter((r) => r.role === "Buyer");
		if (tab === "selling") return all.filter((r) => r.role === "Seller");
		return all;
	}, [data, tab]);

	const inEscrow = useMemo(
		() =>
			sumUsd(
				...(data ?? [])
					.filter((r) => r.status === "PAID" || r.status === "DISPUTED")
					.map((r) => r.sellerAmountUsd)
			),
		[data]
	);

	return (
		<Page title="Orders" sub="Payments, delivery and escrow release">
			<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
				<div className="seg">
					<label className="seg-opt">
						<input type="radio" name="otab" checked={tab === "all"} onChange={() => setTab("all")} />
						All
					</label>
					<label className="seg-opt">
						<input type="radio" name="otab" checked={tab === "buying"} onChange={() => setTab("buying")} />
						Buying
					</label>
					<label className="seg-opt">
						<input type="radio" name="otab" checked={tab === "selling"} onChange={() => setTab("selling")} />
						Selling
					</label>
				</div>
				<span className="text-muted" style={{ marginLeft: "auto", ...mono, fontSize: 11, letterSpacing: "0.1em" }}>
					{rows.length} ORDERS · {fmtUsd(inEscrow)} USDT IN ESCROW
				</span>
			</div>

			<AsyncPanel loading={loading} error={error} isEmpty={rows.length === 0} emptyMessage="No orders yet">
				<table className="table">
					<thead>
						<tr>
							<th>Service</th>
							<th>Role</th>
							<th>Amount</th>
							<th>Fee (4%)</th>
							<th>Escrow flow</th>
							<th>Status</th>
							<th>Created</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((order, index) => {
							const chip = orderStatusTag(order.status);
							const steps = escrowSteps(order);
							return (
								<tr
									key={`${order.role}-${order.id}`}
									className="row-click"
									onClick={() => navigate(`/orders/${order.id}`)}
									style={{ animation: `fadeUp .35s ease ${(index * 0.05).toFixed(2)}s both` }}
								>
									<td>
										<div style={{ fontWeight: 600, fontSize: 13.5 }}>{order.titleSnapshot}</div>
										<div className="text-muted" style={{ ...mono, fontSize: 11 }}>
											{order.id}
										</div>
									</td>
									<td style={{ fontSize: 13 }}>{order.role}</td>
									<td style={{ ...mono, fontSize: 13 }}>{fmtUsd(order.amountUsd)}</td>
									<td className="text-muted" style={{ ...mono, fontSize: 12 }}>
										{fmtUsd(order.feeUsd)}
									</td>
									<td>
										<div style={{ display: "flex", gap: 3, width: 84 }}>
											{Array.from({ length: 5 }, (_, i) => (
												<span
													key={i}
													style={{
														flex: 1,
														height: 6,
														background:
															i < steps.filled
																? steps.bad
																	? "var(--bad)"
																	: "var(--color-accent)"
																: muted15,
													}}
												/>
											))}
										</div>
									</td>
									<td>
										<StatusTag label={chip.label} color={chip.color} />
									</td>
									<td className="text-muted" style={{ ...mono, fontSize: 12 }}>
										{formatDate(order.createdAt)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</AsyncPanel>

			<div className="text-muted" style={{ fontSize: 11 }}>
				Click an order to see payment, escrow flow and activity. Escrow bar: payment → escrow → delivery →
				vesting → released.
			</div>
		</Page>
	);
}
