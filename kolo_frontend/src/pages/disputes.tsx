import {
	Box,
	Card,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AsyncSection from "../components/async-section";
import PageContainer from "../components/page-container";
import StatusChip from "../components/status-chip";
import { useDisputes } from "../hooks/use-disputes";
import { useUsers } from "../hooks/use-admin";
import { formatDate, formatRelative } from "../utils/format";

export default function Disputes() {
	const navigate = useNavigate();
	const { data: disputes, loading, error } = useDisputes();
	const { data: users } = useUsers();

	const nameOf = (id: string) =>
		(users ?? []).find((u) => u.id === id)?.displayName ?? id;

	return (
		<PageContainer
			title="Disputes"
			subtitle="Raised when delivery goes wrong. An admin reviews the chat and evidence, then decides."
		>
			<AsyncSection
				loading={loading}
				error={error}
				isEmpty={(disputes ?? []).length === 0}
				emptyMessage="No disputes. That is a good sign."
			>
				<Card variant="outlined">
					<Box sx={{ overflowX: "auto" }}>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>Reason</TableCell>
									<TableCell>Order</TableCell>
									<TableCell>Opened by</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Age</TableCell>
									<TableCell>Opened</TableCell>
								</TableRow>
							</TableHead>

							<TableBody>
								{(disputes ?? []).map((dispute) => (
									<TableRow
										key={dispute.id}
										hover
										sx={{ cursor: "pointer" }}
										onClick={() => navigate(`/disputes/${dispute.id}`)}
									>
										<TableCell sx={{ maxWidth: 380 }}>
											<Typography variant="body2" noWrap>
												{dispute.reason}
											</Typography>
										</TableCell>
										<TableCell>{dispute.orderId}</TableCell>
										<TableCell>{nameOf(dispute.openedBy)}</TableCell>
										<TableCell>
											<StatusChip status={dispute.status} />
										</TableCell>
										<TableCell>{formatRelative(dispute.createdAt)}</TableCell>
										<TableCell>{formatDate(dispute.createdAt)}</TableCell>
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
