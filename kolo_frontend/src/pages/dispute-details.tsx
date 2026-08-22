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
	MenuItem,
	Slider,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AsyncSection from "../components/async-section";
import DisputeChat from "../components/dispute-chat";
import PageContainer from "../components/page-container";
import StatusChip from "../components/status-chip";
import { useUsers } from "../hooks/use-admin";
import { useAuth } from "../hooks/use-auth";
import { useDispute, useDisputeChat, useDisputeEvidence } from "../hooks/use-disputes";
import * as adminService from "../services/admin.service";
import * as disputesService from "../services/disputes.service";
import type { DisputeResolution } from "../types";
import { formatDateTime } from "../utils/format";

const CLOSED = ["resolved_buyer", "resolved_seller", "resolved_partial"];

export default function DisputeDetails() {
	const { id } = useParams();
	const { user, isAdmin } = useAuth();

	const { data: dispute, loading, error, reload } = useDispute(id);
	const { data: users } = useUsers();
	const { data: evidence, reload: reloadEvidence } = useDisputeEvidence(id);
	const { messages, sending, send } = useDisputeChat(id, user?.id);

	const [outcome, setOutcome] = useState<DisputeResolution["outcome"]>("resolved_buyer");
	const [note, setNote] = useState("");
	const [buyerShare, setBuyerShare] = useState(50);
	const [resolveOpen, setResolveOpen] = useState(false);
	const [evidenceOpen, setEvidenceOpen] = useState(false);
	const [evidenceText, setEvidenceText] = useState("");
	const [busy, setBusy] = useState(false);

	const isClosed = dispute ? CLOSED.includes(dispute.status) : false;

	const submitResolution = async () => {
		if (!dispute || !user || !note.trim()) return;

		setBusy(true);
		try {
			const resolution: DisputeResolution =
				outcome === "resolved_partial"
					? { outcome, note: note.trim(), buyerShare }
					: { outcome, note: note.trim() };

			await disputesService.resolveDispute(dispute.id, user.id, resolution);
			await adminService.logAdminAction(
				user.id,
				"resolve_dispute",
				"dispute",
				dispute.id,
				note.trim()
			);
			toast.success("Dispute resolved and logged to the audit trail.");
			reload();
		} catch {
			toast.error("Could not resolve the dispute");
		} finally {
			setBusy(false);
			setResolveOpen(false);
		}
	};

	const submitEvidence = async () => {
		if (!dispute || !user || !evidenceText.trim()) return;

		setBusy(true);
		try {
			await disputesService.submitEvidence(
				dispute.id,
				user.id,
				evidenceText.trim(),
				`https://picsum.photos/seed/${Date.now()}/800/500`
			);
			toast.success("Evidence submitted");
			reloadEvidence();
		} catch {
			toast.error("Could not submit evidence");
		} finally {
			setBusy(false);
			setEvidenceOpen(false);
			setEvidenceText("");
		}
	};

	return (
		<PageContainer title="Dispute" subtitle={dispute && `Order ${dispute.orderId}`}>
			<AsyncSection loading={loading} error={error}>
				{dispute && (
					<Grid container spacing={3}>
						<Grid size={{ xs: 12, md: 8 }}>
							<Card variant="outlined">
								<CardContent>
									<Stack
										direction="row"
										spacing={2}
										sx={{ mb: 2, justifyContent: "space-between", alignItems: "center" }}
									>
										<Typography variant="h6">Conversation</Typography>
										<StatusChip status={dispute.status} size="medium" />
									</Stack>

									{isClosed && (
										<Alert severity="success" sx={{ mb: 2 }}>
											{dispute.resolution}
										</Alert>
									)}

									<DisputeChat
										messages={messages}
										users={users ?? []}
										currentUserId={user?.id}
										sending={sending}
										disabled={isClosed}
										onSend={send}
									/>
								</CardContent>
							</Card>
						</Grid>

						<Grid size={{ xs: 12, md: 4 }}>
							<Card variant="outlined">
								<CardContent>
									<Typography variant="h6" gutterBottom>
										Claim
									</Typography>
									<Typography variant="body2" color="text.secondary">
										{dispute.reason}
									</Typography>

									<Divider sx={{ my: 2 }} />

									<Typography variant="caption" color="text.secondary">
										Opened {formatDateTime(dispute.createdAt)}
									</Typography>
									{dispute.resolvedAt && (
										<Typography
											variant="caption"
											color="text.secondary"
											sx={{ display: "block" }}
										>
											Resolved {formatDateTime(dispute.resolvedAt)}
										</Typography>
									)}
								</CardContent>
							</Card>

							<Card variant="outlined" sx={{ mt: 3 }}>
								<CardContent>
									<Stack
										direction="row"
										sx={{ mb: 2, justifyContent: "space-between", alignItems: "center" }}
									>
										<Typography variant="h6">Evidence</Typography>
										{!isClosed && (
											<Button size="small" onClick={() => setEvidenceOpen(true)}>
												Add
											</Button>
										)}
									</Stack>

									{(evidence ?? []).length === 0 ? (
										<Typography variant="body2" color="text.secondary">
											No evidence submitted yet.
										</Typography>
									) : (
										<Stack spacing={2}>
											{(evidence ?? []).map((item) => {
												const author = (users ?? []).find((u) => u.id === item.userId);
												return (
													<Box key={item.id}>
														<Typography variant="body2">{item.description}</Typography>
														<Typography variant="caption" color="text.secondary">
															{author?.displayName ?? item.userId} ·{" "}
															{formatDateTime(item.createdAt)}
														</Typography>
														<Box
															component="img"
															src={item.fileUrl}
															alt={item.description}
															sx={{ mt: 1, width: "100%", borderRadius: 1 }}
														/>
													</Box>
												);
											})}
										</Stack>
									)}
								</CardContent>
							</Card>

							{isAdmin && !isClosed && (
								<Card variant="outlined" sx={{ mt: 3, borderColor: "warning.main" }}>
									<CardContent>
										<Typography variant="h6" gutterBottom>
											Admin decision
										</Typography>
										<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
											Resolving slashes or releases the seller's escrow accordingly. A note is
											mandatory and is written to the audit log.
										</Typography>
										<Button
											fullWidth
											variant="contained"
											color="warning"
											onClick={() => setResolveOpen(true)}
										>
											Resolve dispute
										</Button>
									</CardContent>
								</Card>
							)}
						</Grid>
					</Grid>
				)}
			</AsyncSection>

			<Dialog open={resolveOpen} onClose={() => setResolveOpen(false)} fullWidth maxWidth="sm">
				<DialogTitle>Resolve dispute</DialogTitle>
				<DialogContent>
					<Stack spacing={3} sx={{ mt: 1 }}>
						<TextField
							select
							label="Outcome"
							value={outcome}
							onChange={(e) => setOutcome(e.target.value as DisputeResolution["outcome"])}
							fullWidth
						>
							<MenuItem value="resolved_buyer">Buyer wins — refund and slash seller</MenuItem>
							<MenuItem value="resolved_seller">Seller wins — funds continue vesting</MenuItem>
							<MenuItem value="resolved_partial">Partial — custom split</MenuItem>
						</TextField>

						{outcome === "resolved_partial" && (
							<Box>
								<Typography variant="body2" color="text.secondary" gutterBottom>
									Buyer receives {buyerShare}%, seller receives {100 - buyerShare}%
								</Typography>
								<Slider
									value={buyerShare}
									onChange={(_, value) => setBuyerShare(value as number)}
									step={5}
									marks
									min={0}
									max={100}
								/>
							</Box>
						)}

						<TextField
							label="Admin note (required)"
							value={note}
							onChange={(e) => setNote(e.target.value)}
							multiline
							minRows={3}
							fullWidth
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setResolveOpen(false)}>Cancel</Button>
					<Button
						variant="contained"
						color="warning"
						disabled={busy || !note.trim()}
						onClick={submitResolution}
					>
						Confirm resolution
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={evidenceOpen} onClose={() => setEvidenceOpen(false)} fullWidth maxWidth="sm">
				<DialogTitle>Submit evidence</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						fullWidth
						multiline
						minRows={3}
						label="Describe what this proves"
						value={evidenceText}
						onChange={(e) => setEvidenceText(e.target.value)}
						sx={{ mt: 1 }}
					/>
					<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
						File upload is stubbed in this build; a placeholder attachment is generated.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setEvidenceOpen(false)}>Cancel</Button>
					<Button variant="contained" disabled={busy || !evidenceText.trim()} onClick={submitEvidence}>
						Submit
					</Button>
				</DialogActions>
			</Dialog>
		</PageContainer>
	);
}
