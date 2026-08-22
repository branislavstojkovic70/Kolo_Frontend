import { useState, type FormEvent } from "react";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Grid,
	InputAdornment,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PageContainer from "../components/page-container";
import { useCategories, useCreateAd } from "../hooks/use-ads";
import { useAuth } from "../hooks/use-auth";
import { PLATFORM_FEE_RATE } from "../types";
import { formatCurrency } from "../utils/format";

const MIN_PRICE = 20;
const MAX_PRICE = 10_000;

export default function CreateAd() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { data: categories } = useCategories();
	const createAd = useCreateAd(user?.id);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [price, setPrice] = useState("");
	const [deliveryDays, setDeliveryDays] = useState("5");
	const [revisionCount, setRevisionCount] = useState("2");
	const [error, setError] = useState<string>();
	const [submitting, setSubmitting] = useState(false);

	const priceValue = Number(price);

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();

		if (priceValue < MIN_PRICE || priceValue > MAX_PRICE) {
			setError(`Price must be between ${MIN_PRICE} and ${MAX_PRICE} USDT`);
			return;
		}

		setSubmitting(true);
		setError(undefined);

		try {
			const ad = await createAd({
				title,
				description,
				categoryId,
				price: priceValue,
				deliveryDays: Number(deliveryDays),
				revisionCount: Number(revisionCount),
			});
			toast.success("Ad saved as draft. Publish it when you are ready.");
			navigate(`/ads/${ad.id}`);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Could not create the ad");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<PageContainer
			title="Post a new ad"
			subtitle="Describe the service you sell. New ads start as a draft so you can review before publishing."
			maxWidth="md"
		>
			<Card variant="outlined">
				<CardContent sx={{ p: 3 }}>
					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}

					<Box component="form" onSubmit={handleSubmit}>
						<Stack spacing={3}>
							<TextField
								label="Title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g. React + TypeScript landing page, pixel perfect"
								required
								fullWidth
							/>

							<TextField
								label="Description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="What exactly does the buyer receive? Scope, stack, deliverables."
								multiline
								minRows={6}
								required
								fullWidth
							/>

							<Grid container spacing={2}>
								<Grid size={{ xs: 12, sm: 6 }}>
									<TextField
										select
										label="Category"
										value={categoryId}
										onChange={(e) => setCategoryId(e.target.value)}
										required
										fullWidth
									>
										{(categories ?? []).map((category) => (
											<MenuItem key={category.id} value={category.id}>
												{category.name}
											</MenuItem>
										))}
									</TextField>
								</Grid>

								<Grid size={{ xs: 12, sm: 6 }}>
									<TextField
										label="Price"
										type="number"
										value={price}
										onChange={(e) => setPrice(e.target.value)}
										required
										fullWidth
										slotProps={{
											input: {
												endAdornment: <InputAdornment position="end">USDT</InputAdornment>,
											},
											htmlInput: { min: MIN_PRICE, max: MAX_PRICE },
										}}
									/>
								</Grid>

								<Grid size={{ xs: 12, sm: 6 }}>
									<TextField
										label="Delivery time"
										type="number"
										value={deliveryDays}
										onChange={(e) => setDeliveryDays(e.target.value)}
										required
										fullWidth
										slotProps={{
											input: {
												endAdornment: <InputAdornment position="end">days</InputAdornment>,
											},
											htmlInput: { min: 1, max: 90 },
										}}
									/>
								</Grid>

								<Grid size={{ xs: 12, sm: 6 }}>
									<TextField
										label="Included revisions"
										type="number"
										value={revisionCount}
										onChange={(e) => setRevisionCount(e.target.value)}
										required
										fullWidth
										slotProps={{ htmlInput: { min: 0, max: 10 } }}
									/>
								</Grid>
							</Grid>

							{priceValue > 0 && (
								<Alert severity="info">
									Buyers pay {formatCurrency(priceValue)}. After the{" "}
									{(PLATFORM_FEE_RATE * 100).toFixed(0)}% platform fee you receive{" "}
									<strong>{formatCurrency(priceValue * (1 - PLATFORM_FEE_RATE))}</strong>, released
									after your vesting period.
								</Alert>
							)}

							<Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
								<Button onClick={() => navigate(-1)}>Cancel</Button>
								<Button type="submit" variant="contained" disabled={submitting}>
									{submitting ? "Saving..." : "Save as draft"}
								</Button>
							</Stack>
						</Stack>
					</Box>
				</CardContent>
			</Card>

			<Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
				Ads are checked against the content policy before going live.
			</Typography>
		</PageContainer>
	);
}
