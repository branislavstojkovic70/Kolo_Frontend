import { useMemo, useState } from "react";
import {
	Box,
	Card,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Tab,
	Tabs,
	Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AsyncSection from "../components/async-section";
import PageContainer from "../components/page-container";
import StatusChip from "../components/status-chip";
import { useAuth } from "../hooks/use-auth";
import { useOrders } from "../hooks/use-orders";
import { formatCurrency, formatDate } from "../utils/format";

type Filter = "all" | "buying" | "selling";

export default function Orders() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { data: orders, loading, error } = useOrders(user?.id);
	const [filter, setFilter] = useState<Filter>("all");

	const visible = useMemo(() => {
		const list = orders ?? [];
		if (filter === "buying") return list.filter((o) => o.buyerId === user?.id);
		if (filter === "selling") return list.filter((o) => o.sellerId === user?.id);
		return list;
	}, [orders, filter, user?.id]);

	return (
		<PageContainer
			title="Orders"
			subtitle="Track payments, delivery and escrow release across everything you buy and sell."
		>
			<Tabs value={filter} onChange={(_, value: Filter) => setFilter(value)} sx={{ mb: 2 }}>
				<Tab label="All" value="all" />
				<Tab label="Buying" value="buying" />
				<Tab label="Selling" value="selling" />
			</Tabs>

			<AsyncSection
				loading={loading}
				error={error}
				isEmpty={visible.length === 0}
				emptyMessage="No orders here yet."
			>
				<Card variant="outlined">
					<Box sx={{ overflowX: "auto" }}>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>Service</TableCell>
									<TableCell>Role</TableCell>
									<TableCell align="right">Amount</TableCell>
									<TableCell align="right">Fee</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Created</TableCell>
								</TableRow>
							</TableHead>

							<TableBody>
								{visible.map((order) => (
									<TableRow
										key={order.id}
										hover
										sx={{ cursor: "pointer" }}
										onClick={() => navigate(`/orders/${order.id}`)}
									>
										<TableCell>
											<Typography variant="body2" sx={{ fontWeight: 500 }}>
												{order.adTitle}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{order.id}
											</Typography>
										</TableCell>
										<TableCell>{order.buyerId === user?.id ? "Buyer" : "Seller"}</TableCell>
										<TableCell align="right">{formatCurrency(order.amount)}</TableCell>
										<TableCell align="right">
											<Typography variant="body2" color="text.secondary">
												{formatCurrency(order.feeAmount)}
											</Typography>
										</TableCell>
										<TableCell>
											<StatusChip status={order.status} />
										</TableCell>
										<TableCell>{formatDate(order.createdAt)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Box>
				</Card>
			</AsyncSection>
		</PageContainer>
	);
}
