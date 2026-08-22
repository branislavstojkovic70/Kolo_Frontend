import {
	Box,
	Button,
	Card,
	Chip,
	List,
	ListItemButton,
	ListItemText,
	Stack,
	Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AsyncSection from "../components/async-section";
import PageContainer from "../components/page-container";
import { useAuth } from "../hooks/use-auth";
import { useNotifications } from "../hooks/use-notifications";
import { formatRelative, humanise } from "../utils/format";

export default function Notifications() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead } =
		useNotifications(user?.id);

	const open = async (id: string, link?: string) => {
		await markAsRead(id);
		if (link) navigate(link);
	};

	return (
		<PageContainer
			title="Notifications"
			subtitle={unreadCount > 0 ? `${unreadCount} unread` : "You are all caught up"}
			action={
				unreadCount > 0 && <Button onClick={markAllAsRead}>Mark all as read</Button>
			}
		>
			<AsyncSection
				loading={loading}
				error={error}
				isEmpty={notifications.length === 0}
				emptyMessage="No notifications yet."
			>
				<Card variant="outlined">
					<List disablePadding>
						{notifications.map((notification) => (
							<ListItemButton
								key={notification.id}
								onClick={() => open(notification.id, notification.link)}
								sx={{
									borderLeft: 3,
									borderColor: notification.read ? "transparent" : "primary.main",
									py: 2,
								}}
							>
								<ListItemText
									primary={
										<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
											<Typography
												variant="subtitle2"
												sx={{ fontWeight: notification.read ? 500 : 700 }}
											>
												{notification.title}
											</Typography>
											<Chip size="small" variant="outlined" label={humanise(notification.type)} />
										</Stack>
									}
									secondary={
										<Box component="span" sx={{ display: "block", mt: 0.5 }}>
											<Typography variant="body2" color="text.secondary" component="span">
												{notification.body}
											</Typography>
											<Typography
												variant="caption"
												color="text.secondary"
												component="span"
												sx={{ display: "block", mt: 0.5 }}
											>
												{formatRelative(notification.createdAt)}
											</Typography>
										</Box>
									}
								/>
							</ListItemButton>
						))}
					</List>
				</Card>
			</AsyncSection>
		</PageContainer>
	);
}
