import { useState } from "react";
import {
	Button,
	Card,
	CardContent,
	Grid,
	InputAdornment,
	MenuItem,
	Slider,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { Add, Search } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import AdCard from "../components/ad-card";
import AsyncSection from "../components/async-section";
import PageContainer from "../components/page-container";
import { useAds, useCategories } from "../hooks/use-ads";
import { useAuth } from "../hooks/use-auth";

const MAX_PRICE = 1000;

export default function Ads() {
	const navigate = useNavigate();
	const { isSeller } = useAuth();

	const [search, setSearch] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [priceRange, setPriceRange] = useState<number[]>([0, MAX_PRICE]);
	const [maxDeliveryDays, setMaxDeliveryDays] = useState("");

	const { data: categories } = useCategories();
	const { data: ads, loading, error } = useAds({
		search: search || undefined,
		categoryId: categoryId || undefined,
		minPrice: priceRange[0],
		maxPrice: priceRange[1],
		maxDeliveryDays: maxDeliveryDays ? Number(maxDeliveryDays) : undefined,
	});

	return (
		<PageContainer
			title="Marketplace"
			subtitle="Browse web services and pay in crypto. Funds stay in escrow until you confirm delivery."
			action={
				isSeller && (
					<Button variant="contained" startIcon={<Add />} onClick={() => navigate("/ads/new")}>
						Post an ad
					</Button>
				)
			}
		>
			<Card variant="outlined" sx={{ mb: 3 }}>
				<CardContent>
					<Grid container spacing={2} sx={{ alignItems: "center" }}>
						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								fullWidth
								size="small"
								placeholder="Search services..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<Search fontSize="small" />
											</InputAdornment>
										),
									},
								}}
							/>
						</Grid>

						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<TextField
								select
								fullWidth
								size="small"
								label="Category"
								value={categoryId}
								onChange={(e) => setCategoryId(e.target.value)}
							>
								<MenuItem value="">All categories</MenuItem>
								{(categories ?? []).map((category) => (
									<MenuItem key={category.id} value={category.id}>
										{category.name}
									</MenuItem>
								))}
							</TextField>
						</Grid>

						<Grid size={{ xs: 12, sm: 6, md: 2 }}>
							<TextField
								select
								fullWidth
								size="small"
								label="Delivery"
								value={maxDeliveryDays}
								onChange={(e) => setMaxDeliveryDays(e.target.value)}
							>
								<MenuItem value="">Any</MenuItem>
								<MenuItem value="3">Up to 3 days</MenuItem>
								<MenuItem value="7">Up to 7 days</MenuItem>
								<MenuItem value="14">Up to 14 days</MenuItem>
							</TextField>
						</Grid>

						<Grid size={{ xs: 12, md: 3 }}>
							<Typography variant="caption" color="text.secondary">
								Price: {priceRange[0]} – {priceRange[1]} USDT
							</Typography>
							<Slider
								value={priceRange}
								onChange={(_, value) => setPriceRange(value as number[])}
								min={0}
								max={MAX_PRICE}
								step={20}
								size="small"
							/>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			<AsyncSection
				loading={loading}
				error={error}
				isEmpty={(ads ?? []).length === 0}
				emptyMessage="No services match those filters."
			>
				<Stack spacing={2}>
					<Typography variant="body2" color="text.secondary">
						{(ads ?? []).length} service{(ads ?? []).length === 1 ? "" : "s"} available
					</Typography>

					<Grid container spacing={3}>
						{(ads ?? []).map((ad) => (
							<Grid key={ad.id} size={{ xs: 12, sm: 6, md: 4 }}>
								<AdCard ad={ad} />
							</Grid>
						))}
					</Grid>
				</Stack>
			</AsyncSection>
		</PageContainer>
	);
}
