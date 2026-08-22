import {
	Box,
	Card,
	CardActionArea,
	CardContent,
	CardMedia,
	Chip,
	Rating,
	Stack,
	Typography,
} from "@mui/material";
import { AccessTime } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import type { Ad } from "../types";
import { formatCurrency } from "../utils/format";

export default function AdCard({ ad }: { ad: Ad }) {
	const navigate = useNavigate();
	const cover = ad.images[0]?.url;

	return (
		<Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
			<CardActionArea
				onClick={() => navigate(`/ads/${ad.id}`)}
				sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
			>
				<CardMedia
					component="img"
					height="160"
					image={cover ?? "https://picsum.photos/seed/kolo-placeholder/800/500"}
					alt={ad.title}
				/>

				<CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
					<Stack direction="row" spacing={1} sx={{ mb: 1 }}>
						{ad.featured && <Chip size="small" color="primary" label="Featured" />}
						<Chip
							size="small"
							variant="outlined"
							icon={<AccessTime sx={{ fontSize: 14 }} />}
							label={`${ad.deliveryDays}d delivery`}
						/>
					</Stack>

					<Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
						{ad.title}
					</Typography>

					<Typography
						variant="body2"
						color="text.secondary"
						sx={{
							display: "-webkit-box",
							WebkitLineClamp: 2,
							WebkitBoxOrient: "vertical",
							overflow: "hidden",
							mb: 2,
						}}
					>
						{ad.description}
					</Typography>

					<Box sx={{ mt: "auto" }}>
						<Stack direction="row"  spacing={1} sx={{ mb: 1, alignItems: "center" }}>
							<Rating value={ad.rating} precision={0.1} size="small" readOnly />
							<Typography variant="caption" color="text.secondary">
								{ad.rating.toFixed(1)} ({ad.reviewCount})
							</Typography>
						</Stack>

						<Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
							{formatCurrency(ad.price)}
						</Typography>
					</Box>
				</CardContent>
			</CardActionArea>
		</Card>
	);
}
