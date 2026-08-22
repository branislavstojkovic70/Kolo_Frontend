import { useState } from "react";
import {
	Alert,
	Avatar,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Grid,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Tab,
	Tabs,
	TextField,
	Typography,
} from "@mui/material";
import { AccountBalanceWallet, Lock, Savings } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AsyncSection from "../components/async-section";
import PageContainer from "../components/page-container";
import ReputationBadge from "../components/reputation-badge";
import StatCard from "../components/stat-card";
import StatusChip from "../components/status-chip";
import { useSellerAds } from "../hooks/use-ads";
import { useReputationEvents } from "../hooks/use-admin";
import { useAuth } from "../hooks/use-auth";
import { useVestingEntries, useWallet } from "../hooks/use-wallet";
import * as walletService from "../services/wallet.service";
import { formatCurrency, formatDate, formatDateTime, humanise } from "../utils/format";
import { formatVestingPeriod, getVestingTier } from "../utils/vesting";

type TabKey = "wallet" | "ads" | "reputation";

export default function Profile() {
	const navigate = useNavigate();
	const { user } = useAuth();

	const { data: wallet, loading, error, reload } = useWallet(user?.id);
	const { data: vesting } = useVestingEntries(user?.id);
	const { data: ads } = useSellerAds(user?.id);
	const { data: events } = useReputationEvents(user?.id);

	const [tab, setTab] = useState<TabKey>("wallet");
	const [amount, setAmount] = useState("");
	const [busy, setBusy] = useState(false);

	const tier = user ? getVestingTier(user.reputationScore) : undefined;

	const handleWithdraw = async () => {
		if (!user) return;
		setBusy(true);
		try {
			await walletService.withdraw(user.id, Number(amount));
			toast.success("Withdrawal requested");
			setAmount("");
			reload();
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : "Withdrawal failed");
		} finally {
			setBusy(false);
		}
	};

	if (!user) return null;

	return (
		<PageContainer title="Profile" subtitle={user.email}>
			<Grid container spacing={3}>
				<Grid size={{ xs: 12, md: 4 }}>
					<Card variant="outlined">
						<CardContent>
							<Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
								<Avatar sx={{ width: 72, height: 72, fontSize: 28 }}>
									{user.displayName.charAt(0)}
								</Avatar>
								<Box>
									<Typography variant="h6" sx={{ fontWeight: 600 }}>
										{user.displayName}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										Member since {formatDate(user.createdAt)}
									</Typography>
								</Box>
								<Stack direction="row" spacing={1}>
									<Chip size="small" label={humanise(user.role)} color="primary" />
									<Chip size="small" variant="outlined" label={humanise(user.status)} />
								</Stack>
							</Stack>

							<Divider sx={{ my: 3 }} />

							<ReputationBadge score={user.reputationScore} />

							{user.bio && (
								<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
									{user.bio}
								</Typography>
							)}

							{user.payoutWalletAddress && (
								<Box sx={{ mt: 2 }}>
									<Typography variant="caption" color="text.secondary">
										Payout wallet
									</Typography>
									<Typography variant="body2" sx={{ wordBreak: "break-all" }}>
										{user.payoutWalletAddress}
									</Typography>
								</Box>
							)}

							{!user.emailVerified && (
								<Alert severity="warning" sx={{ mt: 2 }}>
									Verify your email to start selling.
								</Alert>
							)}
						</CardContent>
					</Card>
				</Grid>

				<Grid size={{ xs: 12, md: 8 }}>
					<Tabs value={tab} onChange={(_, value: TabKey) => setTab(value)} sx={{ mb: 2 }}>
						<Tab label="Wallet & vesting" value="wallet" />
						<Tab label="My ads" value="ads" />
						<Tab label="Reputation" value="reputation" />
					</Tabs>

					{tab === "wallet" && (
						<AsyncSection loading={loading} error={error}>
							{wallet && (
								<Stack spacing={3}>
									<Grid container spacing={2}>
										<Grid size={{ xs: 12, sm: 4 }}>
											<StatCard
												label="In escrow"
												value={formatCurrency(wallet.escrowBalance)}
												hint="Held until delivery is confirmed"
												icon={<Lock fontSize="small" color="disabled" />}
											/>
										</Grid>
										<Grid size={{ xs: 12, sm: 4 }}>
											<StatCard
												label="Vesting"
												value={formatCurrency(wallet.vestingBalance)}
												hint={tier && `Releases after ${formatVestingPeriod(tier.hours)}`}
												icon={<Savings fontSize="small" color="disabled" />}
											/>
										</Grid>
										<Grid size={{ xs: 12, sm: 4 }}>
											<StatCard
												label="Available"
												value={formatCurrency(wallet.availableBalance)}
												hint="Ready to withdraw"
												icon={<AccountBalanceWallet fontSize="small" color="disabled" />}
											/>
										</Grid>
									</Grid>

									<Card variant="outlined">
										<CardContent>
											<Typography variant="h6" gutterBottom>
												Withdraw
											</Typography>
											<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
												<TextField
													label="Amount"
													type="number"
													size="small"
													value={amount}
													onChange={(e) => setAmount(e.target.value)}
													fullWidth
												/>
												<Button
													variant="contained"
													disabled={busy || !amount}
													onClick={handleWithdraw}
													sx={{ whiteSpace: "nowrap" }}
												>
													Withdraw
												</Button>
											</Stack>
										</CardContent>
									</Card>

									<Card variant="outlined">
										<CardContent>
											<Typography variant="h6" gutterBottom>
												Vesting entries
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
													</TableRow>
												</TableHead>
												<TableBody>
													{(vesting ?? []).map((entry) => (
														<TableRow key={entry.id}>
															<TableCell>{entry.orderId}</TableCell>
															<TableCell align="right">{formatCurrency(entry.amount)}</TableCell>
															<TableCell>{formatDate(entry.releaseAt)}</TableCell>
															<TableCell>
																<StatusChip status={entry.status} />
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

					{tab === "ads" && (
						<Card variant="outlined">
							<Box sx={{ overflowX: "auto" }}>
								<Table>
									<TableHead>
										<TableRow>
											<TableCell>Title</TableCell>
											<TableCell align="right">Price</TableCell>
											<TableCell align="right">Orders</TableCell>
											<TableCell>Status</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{(ads ?? []).map((ad) => (
											<TableRow
												key={ad.id}
												hover
												sx={{ cursor: "pointer" }}
												onClick={() => navigate(`/ads/${ad.id}`)}
											>
												<TableCell>{ad.title}</TableCell>
												<TableCell align="right">{formatCurrency(ad.price)}</TableCell>
												<TableCell align="right">{ad.ordersCount}</TableCell>
												<TableCell>
													<StatusChip status={ad.status} />
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</Box>
						</Card>
					)}

					{tab === "reputation" && (
						<Card variant="outlined">
							<CardContent>
								<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
									Your score determines how fast funds are released. Higher reputation means a
									shorter vesting period.
								</Typography>
							</CardContent>
							<Box sx={{ overflowX: "auto" }}>
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell>Event</TableCell>
											<TableCell align="right">Change</TableCell>
											<TableCell>Order</TableCell>
											<TableCell>When</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{(events ?? []).map((event) => (
											<TableRow key={event.id}>
												<TableCell>
													{humanise(event.type)}
													{event.reason && (
														<Typography
															variant="caption"
															color="text.secondary"
															sx={{ display: "block" }}
														>
															{event.reason}
														</Typography>
													)}
												</TableCell>
												<TableCell align="right">
													<Typography
														variant="body2"
														sx={{ fontWeight: 600 }}
														color={event.delta >= 0 ? "success.main" : "error.main"}
													>
														{event.delta > 0 ? `+${event.delta}` : event.delta}
													</Typography>
												</TableCell>
												<TableCell>{event.orderId ?? "—"}</TableCell>
												<TableCell>{formatDateTime(event.createdAt)}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</Box>
						</Card>
					)}
				</Grid>
			</Grid>
		</PageContainer>
	);
}
