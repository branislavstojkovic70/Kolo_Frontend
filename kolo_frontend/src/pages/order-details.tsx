import { useState } from "react";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Grid,
	Stack,
	Step,
	StepLabel,
	Stepper,
	TextField,
	Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AsyncSection from "../components/async-section";
import PageContainer from "../components/page-container";
import StatusChip from "../components/status-chip";
import { useUser } from "../hooks/use-admin";
import { useAuth } from "../hooks/use-auth";
import { useOrder, useOrderPayment } from "../hooks/use-orders";
import * as disputesService from "../services/disputes.service";
import * as ordersService from "../services/orders.service";
import type { OrderStatus } from "../types";
import { formatCurrency, formatDateTime } from "../utils/format";

const STEPS: OrderStatus[] = ["pending_payment", "paid", "in_progress", "delivered", "completed"];

export default function OrderDetails() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();

	const { data: order, loading, error, reload } = useOrder(id);
	const { data: payment } = useOrderPayment(id);
	const { data: counterparty } = useUser(
		order ? (order.buyerId === user?.id ? order.sellerId : order.buyerId) : undefined
	);

	const [disputeOpen, setDisputeOpen] = useState(false);
	const [disputeReason, setDisputeReason] = useState("");
	const [busy, setBusy] = useState(false);

	const isBuyer = order?.buyerId === user?.id;
	const isSeller = order?.sellerId === user?.id;
	const activeStep = order ? Math.max(0, STEPS.indexOf(order.status)) : 0;

	const advance = async (status: OrderStatus, message: string) => {
		if (!order) return;
		setBusy(true);
		try {
			await ordersService.updateOrderStatus(order.id, status);
			toast.success(message);
			reload();
		} catch {
			toast.error("Could not update the order");
		} finally {
			setBusy(false);
		}
	};

	const submitDispute = async () => {
		if (!order || !user || !disputeReason.trim()) return;
		setBusy(true);
		try {
			const dispute = await disputesService.openDispute(order.id, user.id, disputeReason.trim());
			await ordersService.updateOrderStatus(order.id, "disputed");
			toast.success("Dispute opened. An admin will review it.");
			navigate(`/disputes/${dispute.id}`);
		} catch {
			toast.error("Could not open the dispute");
		} finally {
			setBusy(false);
			setDisputeOpen(false);
		}
	};

	const canDispute =
		order && ["in_progress", "delivered", "completed"].includes(order.status);

	return (
		<PageContainer title="Order" subtitle={order?.adTitle}>
			<AsyncSection loading={loading} error={error}>
				{order && (
					<Grid container spacing={3}>
						<Grid size={{ xs: 12, md: 8 }}>
							<Card variant="outlined">
								<CardContent>
									<Stack direction="row" sx={{ mb: 3, justifyContent: "space-between" }}>
										<Typography variant="h6">Progress</Typography>
										<StatusChip status={order.status} size="medium" />
									</Stack>

									{["disputed", "refunded", "cancelled"].includes(order.status) ? (
										<Alert severity="warning">
											This order is {order.status}. Escrow is frozen until it is resolved.
										</Alert>
									) : (
										<Stepper activeStep={activeStep} alternativeLabel>
											{STEPS.map((step) => (
												<Step key={step}>
													<StepLabel>
														{step
															.replace(/_/g, " ")
															.replace(/^./, (c) => c.toUpperCase())}
													</StepLabel>
												</Step>
											))}
										</Stepper>
									)}

									<Divider sx={{ my: 3 }} />

									<Stack spacing={1}>
										<Row label="Order ID" value={order.id} />
										<Row label="Created" value={formatDateTime(order.createdAt)} />
										{order.deliveredAt && (
											<Row label="Delivered" value={formatDateTime(order.deliveredAt)} />
										)}
										{order.autoConfirmAt && (
											<Row label="Auto-confirms" value={formatDateTime(order.autoConfirmAt)} />
										)}
										{order.completedAt && (
											<Row label="Completed" value={formatDateTime(order.completedAt)} />
										)}
										{counterparty && (
											<Row
												label={isBuyer ? "Seller" : "Buyer"}
												value={counterparty.displayName}
											/>
										)}
									</Stack>
								</CardContent>
							</Card>

							{payment && (
								<Card variant="outlined" sx={{ mt: 3 }}>
									<CardContent>
										<Typography variant="h6" gutterBottom>
											Payment
										</Typography>

										<Stack spacing={1}>
											<Row label="OxaPay track ID" value={payment.oxapayTrackId} />
											<Row label="Currency" value={payment.currency} />
											<Row label="Amount paid" value={formatCurrency(payment.amountPaid, payment.currency)} />
											<Row label="Status" value={payment.status} />
											{payment.payAddress && <Row label="Pay to" value={payment.payAddress} />}
										</Stack>

										{payment.status === "waiting" && (
											<Alert severity="info" sx={{ mt: 2 }}>
												Waiting for the payment to be confirmed on-chain. The order starts
												automatically once OxaPay confirms it.
											</Alert>
										)}
									</CardContent>
								</Card>
							)}
						</Grid>

						<Grid size={{ xs: 12, md: 4 }}>
							<Card variant="outlined">
								<CardContent>
									<Typography variant="h6" gutterBottom>
										Breakdown
									</Typography>

									<Stack spacing={1}>
										<Row label="Service price" value={formatCurrency(order.amount)} />
										<Row label="Platform fee (4%)" value={formatCurrency(order.feeAmount)} />
										<Divider />
										<Row
											label="Seller receives"
											value={formatCurrency(order.amount - order.feeAmount)}
											bold
										/>
									</Stack>

									<Divider sx={{ my: 2 }} />

									<Stack spacing={1}>
										{isSeller && order.status === "in_progress" && (
											<Button
												variant="contained"
												disabled={busy}
												onClick={() => advance("delivered", "Marked as delivered")}
											>
												Mark as delivered
											</Button>
										)}

										{isBuyer && order.status === "delivered" && (
											<Button
												variant="contained"
												disabled={busy}
												onClick={() => advance("completed", "Delivery confirmed. Funds move to vesting.")}
											>
												Confirm delivery
											</Button>
										)}

										{canDispute && (
											<Button color="error" disabled={busy} onClick={() => setDisputeOpen(true)}>
												Open a dispute
											</Button>
										)}

										<Button onClick={() => navigate(`/ads/${order.adId}`)}>View the ad</Button>
									</Stack>
								</CardContent>
							</Card>
						</Grid>
					</Grid>
				)}
			</AsyncSection>

			<Dialog open={disputeOpen} onClose={() => setDisputeOpen(false)} fullWidth maxWidth="sm">
				<DialogTitle>Open a dispute</DialogTitle>
				<DialogContent>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						Explain what went wrong. Both sides can add evidence, and an admin will review the
						chat before deciding.
					</Typography>
					<TextField
						autoFocus
						fullWidth
						multiline
						minRows={4}
						label="Reason"
						value={disputeReason}
						onChange={(e) => setDisputeReason(e.target.value)}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDisputeOpen(false)}>Cancel</Button>
					<Button
						variant="contained"
						color="error"
						disabled={busy || !disputeReason.trim()}
						onClick={submitDispute}
					>
						Open dispute
					</Button>
				</DialogActions>
			</Dialog>
		</PageContainer>
	);
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
	return (
		<Stack direction="row"  spacing={2} sx={{ justifyContent: "space-between" }}>
			<Typography variant="body2" color="text.secondary">
				{label}
			</Typography>
			<Box sx={{ textAlign: "right", wordBreak: "break-all" }}>
				<Typography variant="body2" sx={{ fontWeight: bold ? 700 : 500 }}>
					{value}
				</Typography>
			</Box>
		</Stack>
	);
}
