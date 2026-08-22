import { useState } from "react";
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Grid,
	Stack,
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
import toast from "react-hot-toast";
import AsyncSection from "../components/async-section";
import PageContainer from "../components/page-container";
import StatCard from "../components/stat-card";
import StatusChip from "../components/status-chip";
import {
	useAdminActions,
	useAllAds,
	useFinanceSummary,
	useReviews,
	useUsers,
} from "../hooks/use-admin";
import { useAuth } from "../hooks/use-auth";
import { useDisputes } from "../hooks/use-disputes";
import { useAllVestingEntries } from "../hooks/use-wallet";
import * as adminService from "../services/admin.service";
import * as adsService from "../services/ads.service";
import * as usersService from "../services/users.service";
import * as walletService from "../services/wallet.service";
import { formatCurrency, formatDate, formatDateTime, formatRelative, humanise } from "../utils/format";

type TabKey = "disputes" | "users" | "ads" | "reviews" | "finance" | "audit";

export default function Admin() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [tab, setTab] = useState<TabKey>("disputes");

	const disputes = useDisputes();
	const users = useUsers();
	const ads = useAllAds();
	const reviews = useReviews();
	const finance = useFinanceSummary();
	const vesting = useAllVestingEntries();
	const audit = useAdminActions();

	const act = async (label: string, run: () => Promise<unknown>, reload: () => void) => {
		try {
			await run();
			toast.success(label);
			reload();
			audit.reload();
		} catch {
			toast.error("Action failed");
		}
	};

	const openDisputes = (disputes.data ?? []).filter((d) =>
		["open", "under_review"].includes(d.status)
	);

	return (
		<PageContainer
			title="Admin panel"
			subtitle="Moderation, dispute resolution and platform finances. Every action here is logged."
		>
			<Tabs
				value={tab}
				onChange={(_, value: TabKey) => setTab(value)}
				variant="scrollable"
				scrollButtons="auto"
				sx={{ mb: 3 }}
			>
				<Tab label={`Dispute queue (${openDisputes.length})`} value="disputes" />
				<Tab label="Users" value="users" />
				<Tab label="Ads" value="ads" />
				<Tab label="Reviews" value="reviews" />
				<Tab label="Finance" value="finance" />
				<Tab label="Audit log" value="audit" />
			</Tabs>

			{tab === "disputes" && (
				<AsyncSection
					loading={disputes.loading}
					error={disputes.error}
					isEmpty={openDisputes.length === 0}
					emptyMessage="No open disputes."
				>
					<Card variant="outlined">
						<Box sx={{ overflowX: "auto" }}>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>Reason</TableCell>
										<TableCell>Order</TableCell>
										<TableCell>Status</TableCell>
										<TableCell>Age</TableCell>
										<TableCell align="right">Action</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{openDisputes.map((dispute) => (
										<TableRow key={dispute.id} hover>
											<TableCell sx={{ maxWidth: 400 }}>
												<Typography variant="body2" noWrap>
													{dispute.reason}
												</Typography>
											</TableCell>
											<TableCell>{dispute.orderId}</TableCell>
											<TableCell>
												<StatusChip status={dispute.status} />
											</TableCell>
											<TableCell>{formatRelative(dispute.createdAt)}</TableCell>
											<TableCell align="right">
												<Button size="small" onClick={() => navigate(`/disputes/${dispute.id}`)}>
													Review
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Box>
					</Card>
				</AsyncSection>
			)}

			{tab === "users" && (
				<AsyncSection loading={users.loading} error={users.error}>
					<Card variant="outlined">
						<Box sx={{ overflowX: "auto" }}>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>User</TableCell>
										<TableCell>Role</TableCell>
										<TableCell>Status</TableCell>
										<TableCell align="right">Reputation</TableCell>
										<TableCell align="right">Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{(users.data ?? []).map((row) => (
										<TableRow key={row.id} hover>
											<TableCell>
												<Typography variant="body2" sx={{ fontWeight: 500 }}>
													{row.displayName}
												</Typography>
												<Typography variant="caption" color="text.secondary">
													{row.email}
												</Typography>
											</TableCell>
											<TableCell>
												<Chip size="small" label={humanise(row.role)} />
											</TableCell>
											<TableCell>
												<Chip
													size="small"
													variant="outlined"
													color={row.status === "blocked" ? "error" : "default"}
													label={humanise(row.status)}
												/>
											</TableCell>
											<TableCell align="right">{row.reputationScore}</TableCell>
											<TableCell align="right">
												<Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
													<Button
														size="small"
														onClick={() =>
															act(
																"Reputation adjusted",
																async () => {
																	await usersService.adjustReputation(
																		row.id,
																		5,
																		"Manual admin adjustment"
																	);
																	await adminService.logAdminAction(
																		user!.id,
																		"adjust_reputation",
																		"user",
																		row.id,
																		"Manual admin adjustment (+5)"
																	);
																},
																users.reload
															)
														}
													>
														+5 rep
													</Button>
													<Button
														size="small"
														color={row.status === "blocked" ? "success" : "error"}
														disabled={row.role === "admin"}
														onClick={() =>
															act(
																row.status === "blocked" ? "User unblocked" : "User blocked",
																async () => {
																	const blocking = row.status !== "blocked";
																	await usersService.setUserBlocked(row.id, blocking);
																	await adminService.logAdminAction(
																		user!.id,
																		blocking ? "block_user" : "unblock_user",
																		"user",
																		row.id,
																		blocking ? "Policy violation" : "Appeal accepted"
																	);
																},
																users.reload
															)
														}
													>
														{row.status === "blocked" ? "Unblock" : "Block"}
													</Button>
												</Stack>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Box>
					</Card>
				</AsyncSection>
			)}

			{tab === "ads" && (
				<AsyncSection loading={ads.loading} error={ads.error}>
					<Card variant="outlined">
						<Box sx={{ overflowX: "auto" }}>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>Title</TableCell>
										<TableCell align="right">Price</TableCell>
										<TableCell>Status</TableCell>
										<TableCell align="right">Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{(ads.data ?? []).map((ad) => (
										<TableRow key={ad.id} hover>
											<TableCell sx={{ maxWidth: 420 }}>
												<Typography variant="body2" noWrap>
													{ad.title}
												</Typography>
											</TableCell>
											<TableCell align="right">{formatCurrency(ad.price)}</TableCell>
											<TableCell>
												<StatusChip status={ad.status} />
											</TableCell>
											<TableCell align="right">
												<Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
													<Button size="small" onClick={() => navigate(`/ads/${ad.id}`)}>
														View
													</Button>
													<Button
														size="small"
														disabled={ad.status === "active"}
														onClick={() =>
															act(
																"Ad approved",
																async () => {
																	await adsService.updateAd(ad.id, { status: "active" });
																	await adminService.logAdminAction(
																		user!.id,
																		"approve_ad",
																		"ad",
																		ad.id,
																		"Meets content policy"
																	);
																},
																ads.reload
															)
														}
													>
														Approve
													</Button>
													<Button
														size="small"
														color="error"
														disabled={ad.status === "removed"}
														onClick={() =>
															act(
																"Ad removed",
																async () => {
																	await adsService.updateAd(ad.id, { status: "removed" });
																	await adminService.logAdminAction(
																		user!.id,
																		"remove_ad",
																		"ad",
																		ad.id,
																		"Violates content policy"
																	);
																},
																ads.reload
															)
														}
													>
														Remove
													</Button>
												</Stack>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Box>
					</Card>
				</AsyncSection>
			)}

			{tab === "reviews" && (
				<AsyncSection loading={reviews.loading} error={reviews.error}>
					<Card variant="outlined">
						<Box sx={{ overflowX: "auto" }}>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>Comment</TableCell>
										<TableCell align="right">Rating</TableCell>
										<TableCell>Status</TableCell>
										<TableCell align="right">Action</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{(reviews.data ?? []).map((review) => (
										<TableRow key={review.id} hover>
											<TableCell sx={{ maxWidth: 420 }}>
												<Typography variant="body2" noWrap>
													{review.comment}
												</Typography>
												<Typography variant="caption" color="text.secondary">
													{formatDate(review.createdAt)}
												</Typography>
											</TableCell>
											<TableCell align="right">{review.rating}/5</TableCell>
											<TableCell>
												<Chip
													size="small"
													variant="outlined"
													color={review.status === "deleted" ? "error" : "success"}
													label={humanise(review.status)}
												/>
											</TableCell>
											<TableCell align="right">
												<Button
													size="small"
													color={review.status === "deleted" ? "success" : "error"}
													onClick={() =>
														act(
															review.status === "deleted" ? "Review restored" : "Review deleted",
															async () => {
																const deleting = review.status !== "deleted";
																await adminService.setReviewDeleted(
																	review.id,
																	deleting,
																	user!.id
																);
																await adminService.logAdminAction(
																	user!.id,
																	deleting ? "delete_review" : "restore_review",
																	"review",
																	review.id,
																	deleting ? "Spam or abusive content" : "Restored after appeal"
																);
															},
															reviews.reload
														)
													}
												>
													{review.status === "deleted" ? "Restore" : "Delete"}
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Box>
					</Card>
				</AsyncSection>
			)}

			{tab === "finance" && (
				<AsyncSection loading={finance.loading} error={finance.error}>
					{finance.data && (
						<Stack spacing={3}>
							<Grid container spacing={2}>
								<Grid size={{ xs: 12, sm: 6, md: 3 }}>
									<StatCard
										label="Fees collected"
										value={formatCurrency(finance.data.totalFeesCollected)}
										hint="4% of every payment"
									/>
								</Grid>
								<Grid size={{ xs: 12, sm: 6, md: 3 }}>
									<StatCard label="In escrow" value={formatCurrency(finance.data.inEscrow)} />
								</Grid>
								<Grid size={{ xs: 12, sm: 6, md: 3 }}>
									<StatCard label="Vesting" value={formatCurrency(finance.data.inVesting)} />
								</Grid>
								<Grid size={{ xs: 12, sm: 6, md: 3 }}>
									<StatCard label="Refunded" value={formatCurrency(finance.data.refunded)} />
								</Grid>
							</Grid>

							<Card variant="outlined">
								<CardContent>
									<Typography variant="h6">Vesting entries</Typography>
									<Typography variant="body2" color="text.secondary">
										Override a release or freeze funds while a dispute is open.
									</Typography>
								</CardContent>
								<Box sx={{ overflowX: "auto" }}>
									<Table size="small">
										<TableHead>
											<TableRow>
												<TableCell>Order</TableCell>
												<TableCell align="right">Amount</TableCell>
												<TableCell>Releases</TableCell>
												<TableCell>Status</TableCell>
												<TableCell align="right">Actions</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{(vesting.data ?? []).map((entry) => (
												<TableRow key={entry.id}>
													<TableCell>{entry.orderId}</TableCell>
													<TableCell align="right">{formatCurrency(entry.amount)}</TableCell>
													<TableCell>{formatDate(entry.releaseAt)}</TableCell>
													<TableCell>
														<StatusChip status={entry.status} />
													</TableCell>
													<TableCell align="right">
														<Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
															<Button
																size="small"
																disabled={entry.status === "available"}
																onClick={() =>
																	act(
																		"Vesting released",
																		async () => {
																			await walletService.setVestingStatus(entry.id, "available");
																			await adminService.logAdminAction(
																				user!.id,
																				"release_vesting",
																				"vesting_entry",
																				entry.id,
																				"Manual early release"
																			);
																		},
																		vesting.reload
																	)
																}
															>
																Release
															</Button>
															<Button
																size="small"
																color="warning"
																disabled={entry.status === "frozen"}
																onClick={() =>
																	act(
																		"Vesting frozen",
																		async () => {
																			await walletService.setVestingStatus(entry.id, "frozen");
																			await adminService.logAdminAction(
																				user!.id,
																				"freeze_vesting",
																				"vesting_entry",
																				entry.id,
																				"Frozen pending dispute"
																			);
																		},
																		vesting.reload
																	)
																}
															>
																Freeze
															</Button>
														</Stack>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</Box>
							</Card>
						</Stack>
					)}
				</AsyncSection>
			)}

			{tab === "audit" && (
				<AsyncSection loading={audit.loading} error={audit.error}>
					<Card variant="outlined">
						<Box sx={{ overflowX: "auto" }}>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>Action</TableCell>
										<TableCell>Target</TableCell>
										<TableCell>Reason</TableCell>
										<TableCell>When</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{(audit.data ?? []).map((action) => (
										<TableRow key={action.id}>
											<TableCell>
												<Chip size="small" variant="outlined" label={humanise(action.actionType)} />
											</TableCell>
											<TableCell>
												{humanise(action.targetType)} · {action.targetId}
											</TableCell>
											<TableCell sx={{ maxWidth: 360 }}>
												<Typography variant="body2" color="text.secondary">
													{action.reason}
												</Typography>
											</TableCell>
											<TableCell>{formatDateTime(action.createdAt)}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Box>
					</Card>
				</AsyncSection>
			)}
		</PageContainer>
	);
}
