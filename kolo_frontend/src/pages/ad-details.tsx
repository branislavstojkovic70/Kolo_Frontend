import { useState } from "react";
import {
	Avatar,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Grid,
	Rating,
	Stack,
	Typography,
} from "@mui/material";
import { AccessTime, Autorenew, ShoppingCart } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AsyncSection from "../components/async-section";
import PageContainer from "../components/page-container";
import ReputationBadge from "../components/reputation-badge";
import { useAd, useAdReviews } from "../hooks/use-ads";
import { useUser } from "../hooks/use-admin";
import { useAuth } from "../hooks/use-auth";
import * as ordersService from "../services/orders.service";
import { PLATFORM_FEE_RATE } from "../types";
import { formatCurrency, formatDate } from "../utils/format";

export default function AdDetails() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();

	const { data: ad, loading, error } = useAd(id);
	const { data: reviews } = useAdReviews(id);
	const { data: seller } = useUser(ad?.sellerId);

	const [ordering, setOrdering] = useState(false);

	const handleOrder = async () => {
		if (!user || !ad) return;

		setOrdering(true);
		try {
			const order = await ordersService.createOrder(user.id, {
				id: ad.id,
				sellerId: ad.sellerId,
				title: ad.title,
				price: ad.price,
			});
			toast.success("Order created. Complete the payment to start.");
			navigate(`/orders/${order.id}`);
		} catch {
			toast.error("Could not create the order");
		} finally {
			setOrdering(false);
		}
	};

	const isOwnAd = user?.id === ad?.sellerId;

	return (
		<PageContainer title={ad?.title ?? "Service"} subtitle={seller && `Sold by ${seller.displayName}`}>
			<AsyncSection loading={loading} error={error}>
				{ad && (
					<Grid container spacing={3}>
						<Grid size={{ xs: 12, md: 8 }}>
							<Card variant="outlined">
								{ad.images[0] && (
									<Box
										component="img"
										src={ad.images[0].url}
										alt={ad.title}
										sx={{ width: "100%", maxHeight: 380, objectFit: "cover" }}
									/>
								)}

								<CardContent>
									<Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
										<Chip
											size="small"
											variant="outlined"
											icon={<AccessTime sx={{ fontSize: 16 }} />}
											label={`${ad.deliveryDays} day delivery`}
										/>
										<Chip
											size="small"
											variant="outlined"
											icon={<Autorenew sx={{ fontSize: 16 }} />}
											label={`${ad.revisionCount} revisions`}
										/>
										<Chip size="small" variant="outlined" label={`${ad.ordersCount} orders`} />
									</Stack>

									<Typography variant="h6" gutterBottom>
										About this service
									</Typography>
									<Typography variant="body1" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
										{ad.description}
									</Typography>
								</CardContent>
							</Card>

							<Card variant="outlined" sx={{ mt: 3 }}>
								<CardContent>
									<Stack direction="row"  spacing={2} sx={{ mb: 2, alignItems: "center" }}>
										<Typography variant="h6">Reviews</Typography>
										<Rating value={ad.rating} precision={0.1} size="small" readOnly />
										<Typography variant="body2" color="text.secondary">
											{ad.rating.toFixed(1)} from {ad.reviewCount} reviews
										</Typography>
									</Stack>

									{(reviews ?? []).length === 0 ? (
										<Typography variant="body2" color="text.secondary">
											No reviews yet.
										</Typography>
									) : (
										<Stack spacing={2} divider={<Divider flexItem />}>
											{(reviews ?? []).map((review) => (
												<Box key={review.id}>
													<Stack direction="row"  spacing={1} sx={{ alignItems: "center" }}>
														<Rating value={review.rating} size="small" readOnly />
														<Typography variant="caption" color="text.secondary">
															{formatDate(review.createdAt)}
														</Typography>
													</Stack>
													<Typography variant="body2" sx={{ mt: 0.5 }}>
														{review.comment}
													</Typography>
												</Box>
											))}
										</Stack>
									)}
								</CardContent>
							</Card>
						</Grid>

						<Grid size={{ xs: 12, md: 4 }}>
							<Card variant="outlined" sx={{ position: "sticky", top: 24 }}>
								<CardContent>
									<Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
										{formatCurrency(ad.price)}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										Includes a {(PLATFORM_FEE_RATE * 100).toFixed(0)}% platform fee of{" "}
										{formatCurrency(ad.price * PLATFORM_FEE_RATE)}
									</Typography>

									<Button
										fullWidth
										variant="contained"
										size="large"
										startIcon={<ShoppingCart />}
										sx={{ mt: 2 }}
										disabled={ordering || isOwnAd}
										onClick={handleOrder}
									>
										{isOwnAd ? "This is your ad" : ordering ? "Creating order..." : "Order now"}
									</Button>

									<Typography
										variant="caption"
										color="text.secondary"
										align="center"
										sx={{ display: "block", mt: 1 }}
									>
										Your payment is held in escrow until you confirm delivery.
									</Typography>

									{seller && (
										<>
											<Divider sx={{ my: 3 }} />

											<Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: "center" }}>
												<Avatar>{seller.displayName.charAt(0)}</Avatar>
												<Box>
													<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
														{seller.displayName}
													</Typography>
													<Typography variant="caption" color="text.secondary">
														Member since {formatDate(seller.createdAt)}
													</Typography>
												</Box>
											</Stack>

											<ReputationBadge score={seller.reputationScore} />

											{seller.bio && (
												<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
													{seller.bio}
												</Typography>
											)}
										</>
									)}
								</CardContent>
							</Card>
						</Grid>
					</Grid>
				)}
			</AsyncSection>
		</PageContainer>
	);
}
