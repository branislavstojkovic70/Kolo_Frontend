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
import { protectionSteps, orderStatusTag } from "../lib/order-ui";
import { formatDate, shortRef } from "../utils/format";
import { money } from "../utils/money";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
	{ value: "PENDING_PAYMENT", label: "Awaiting payment" },
	{ value: "PAID", label: "Completed" },
	{ value: "DISPUTED", label: "In resolution" },
	{ value: "REFUNDED", label: "Refunded" },
	{ value: "EXPIRED", label: "Expired" },
];

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
				role: order.buyerId === user?.id ? ("Buying" as const) : ("Selling" as const),
			})),
		[data, user]
	);

	const selectTab = (next: OrderRole) => {
		setTab(next);
		controls.setPage(1);
	};

	return (
		<Page title="Orders" sub="Everything you've bought and sold, and where each order stands.">
			<div className="filter-bar">
				<input
					className="input"
					style={{ flex: 1, maxWidth: 420 }}
					placeholder="Search your orders…"
					value={controls.searchInput}
					onChange={(e) => controls.setSearchInput(e.target.value)}
				/>
				<select
					className="input"
					style={{ width: 190, flex: "0 1 auto", minWidth: 0 }}
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
				<div className="seg" style={{ flex: "none", marginLeft: "auto" }}>
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

			<AsyncPanel
				loading={loading}
				error={error}
				isEmpty={rows.length === 0}
				emptyMessage={
					search || status ? "No orders match those filters." : "You don't have any orders yet."
				}
			>
				{/* `table-cards` + the `data-label` on every cell is what turns these
				    rows into stacked cards below 744px — the head is dropped and each
				    cell prints its own label. `data-label=""` marks the headline
				    cell, which keeps the full width and no label. */}
				<div className="table-wrap">
					<table className="table table-cards">
						<thead>
							<tr>
								<th>Item</th>
								<th>Side</th>
								<th>Price</th>
								<th>Progress</th>
								<th>Status</th>
								<th>Placed</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((order) => {
								const chip = orderStatusTag(order.status);
								const steps = protectionSteps(order);
								return (
									<tr
										key={`${order.role}-${order.id}`}
										className="row-click"
										onClick={() => navigate(`/orders/${order.id}`)}
									>
										<td data-label="">
											<div style={{ fontWeight: 600, fontSize: 15 }}>{order.titleSnapshot}</div>
											<div className="text-muted" style={{ fontSize: 13 }}>
												#{shortRef(order.id)}
											</div>
										</td>
										<td
											className="text-muted"
											data-label="Side"
											style={{ fontSize: 14, whiteSpace: "nowrap" }}
										>
											{order.role}
										</td>
										<td data-label="Price" style={{ fontSize: 15, whiteSpace: "nowrap" }}>
											{money(order.amountUsd)}
											{order.retailPriceUsdSnapshot && (
												<span className="price-was" style={{ fontSize: 13, marginLeft: 6 }}>
													{money(order.retailPriceUsdSnapshot)}
												</span>
											)}
										</td>
										<td data-label="Progress">
											<div
												role="img"
												aria-label={`${chip.label} — step ${steps.filled} of 5`}
												style={{ display: "flex", gap: 3, width: 88, maxWidth: "100%", flex: "none" }}
											>
												{Array.from({ length: 5 }, (_, i) => (
													<span
														key={i}
														style={{
															flex: 1,
															height: 6,
															borderRadius: 3,
															background:
																i < steps.filled ? steps.color : "var(--hairline-soft)",
														}}
													/>
												))}
											</div>
										</td>
										<td data-label="Status">
											<StatusTag label={chip.label} color={chip.color} />
										</td>
										<td
											className="text-muted"
											data-label="Placed"
											style={{ fontSize: 14, whiteSpace: "nowrap" }}
										>
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

			<div className="text-muted" style={{ fontSize: 14 }}>
				Open an order to see your access details, the payment and its history. The progress bar runs
				payment → protected → delivered → clearing → seller paid.
			</div>
		</Page>
	);
}
