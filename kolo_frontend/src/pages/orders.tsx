import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ordersApi, type OrderRole, type OrderStatus } from "../api";
import AsyncPanel from "../components/async-panel";
import Page from "../components/page";
import Pagination from "../components/pagination";
import StatusTag from "../components/status-tag";
import { useAsync } from "../hooks/use-async";
import { useAuth } from "../hooks/use-auth";
import { useListControls } from "../hooks/use-list-controls";
import { escrowSteps, orderStatusTag } from "../lib/order-ui";
import { formatDate } from "../utils/format";
import { fmtUsd, sumUsd } from "../utils/money";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
	{ value: "PENDING_PAYMENT", label: "Awaiting payment" },
	{ value: "PAID", label: "Paid · in escrow" },
	{ value: "DISPUTED", label: "Disputed" },
	{ value: "REFUNDED", label: "Refunded" },
	{ value: "EXPIRED", label: "Expired" },
];

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)" };
const muted15 = "color-mix(in srgb, var(--color-text) 15%, transparent)";

export default function Orders() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [tab, setTab] = useState<OrderRole>("all");
	const controls = useListControls<OrderStatus>();
	const { search, status, page, limit } = controls;

	const { data, loading, error } = useAsync(
		() =>
			ordersApi.list({
				role: tab,
				search: search || undefined,
				status: status || undefined,
				page,
				limit,
			}),
		[tab, search, status, page, limit]
	);

	// One list now carries both sides, so the role label comes from the ids.
	const rows = useMemo(
		() =>
			(data?.items ?? []).map((order) => ({
				...order,
				role: order.buyerId === user?.id ? ("Buyer" as const) : ("Seller" as const),
			})),
		[data, user]
	);

	const pageEscrow = useMemo(
		() =>
			sumUsd(
				...rows
					.filter((r) => r.status === "PAID" || r.status === "DISPUTED")
					.map((r) => r.sellerAmountUsd)
			),
		[rows]
	);

	const selectTab = (next: OrderRole) => {
		setTab(next);
		controls.setPage(1);
	};

	return (
		<Page title="Orders" sub="Payments, delivery and escrow release">
			<div className="filter-bar">
				<input
					className="input"
					style={{ flex: 1 }}
					placeholder="Search orders by title…"
					value={controls.searchInput}
					onChange={(e) => controls.setSearchInput(e.target.value)}
				/>
				<select
					className="input"
					style={{ width: 180, flex: "none" }}
					value={status}
					onChange={(e) => controls.setStatus(e.target.value as OrderStatus | "")}
					aria-label="Filter by status"
				>
					<option value="">Any status</option>
					{STATUS_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				<div className="seg" style={{ flex: "none" }}>
					<label className="seg-opt">
						<input type="radio" name="otab" checked={tab === "all"} onChange={() => selectTab("all")} />
						All
					</label>
					<label className="seg-opt">
						<input type="radio" name="otab" checked={tab === "buying"} onChange={() => selectTab("buying")} />
						Buying
					</label>
					<label className="seg-opt">
						<input type="radio" name="otab" checked={tab === "selling"} onChange={() => selectTab("selling")} />
						Selling
					</label>
				</div>
			</div>

			<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
				<span className="text-muted" style={{ marginLeft: "auto", ...mono, fontSize: 12, letterSpacing: "0.1em" }}>
					{data?.total ?? 0} ORDERS · {fmtUsd(pageEscrow)} USDT IN ESCROW ON THIS PAGE
				</span>
			</div>

			<AsyncPanel
				loading={loading}
				error={error}
				isEmpty={rows.length === 0}
				emptyMessage={search || status ? "No orders match these filters" : "No orders yet"}
			>
				<div className="table-wrap">
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
										<div style={{ fontWeight: 600, fontSize: 14.5 }}>{order.titleSnapshot}</div>
										<div className="text-muted" style={{ ...mono, fontSize: 12 }}>
											{order.id}
										</div>
									</td>
									<td style={{ fontSize: 14 }}>{order.role}</td>
									<td style={{ ...mono, fontSize: 14 }}>{fmtUsd(order.amountUsd)}</td>
									<td className="text-muted" style={{ ...mono, fontSize: 13 }}>
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
									<td className="text-muted" style={{ ...mono, fontSize: 13 }}>
										{formatDate(order.createdAt)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
				</div>
			</AsyncPanel>

			<Pagination
				page={page}
				pages={data?.pages ?? 1}
				limit={limit}
				total={data?.total ?? 0}
				onPage={controls.setPage}
				onLimit={controls.setLimit}
				noun="orders"
			/>

			<div className="text-muted" style={{ fontSize: 12 }}>
				Click an order to see payment, escrow flow and activity. Escrow bar: payment → escrow → delivery →
				vesting → released.
			</div>
		</Page>
	);
}
