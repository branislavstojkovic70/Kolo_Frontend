import { useState } from "react";
import {
	Avatar,
	Box,
	IconButton,
	Paper,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { Send } from "@mui/icons-material";
import type { DisputeMessage, User } from "../types";
import { formatDateTime } from "../utils/format";

interface DisputeChatProps {
	messages: DisputeMessage[];
	users: User[];
	currentUserId: string | undefined;
	sending: boolean;
	disabled?: boolean;
	onSend: (message: string) => void;
}

export default function DisputeChat({
	messages,
	users,
	currentUserId,
	sending,
	disabled,
	onSend,
}: DisputeChatProps) {
	const [draft, setDraft] = useState("");

	const submit = () => {
		if (!draft.trim()) return;
		onSend(draft);
		setDraft("");
	};

	return (
		<Stack spacing={2}>
			<Stack spacing={2} sx={{ maxHeight: 460, overflowY: "auto", pr: 1 }}>
				{messages.map((message) => {
					const sender = users.find((u) => u.id === message.senderId);
					const isMine = message.senderId === currentUserId;
					const isAdmin = sender?.role === "admin";

					return (
						<Stack
							key={message.id}
							direction="row"
							spacing={1.5}
							sx={{ flexDirection: isMine ? "row-reverse" : "row" }}
						>
							<Avatar sx={{ width: 32, height: 32, bgcolor: isAdmin ? "warning.main" : undefined }}>
								{sender?.displayName.charAt(0) ?? "?"}
							</Avatar>

							<Paper
								variant="outlined"
								sx={{
									p: 1.5,
									maxWidth: "75%",
									borderColor: isAdmin ? "warning.main" : undefined,
									bgcolor: isMine ? "action.hover" : undefined,
								}}
							>
								<Stack direction="row" spacing={1} sx={{ mb: 0.5, alignItems: "baseline" }}>
									<Typography variant="caption" sx={{ fontWeight: 600 }}>
										{sender?.displayName ?? "Unknown"}
										{isAdmin && " (admin)"}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{formatDateTime(message.createdAt)}
									</Typography>
								</Stack>

								<Typography variant="body2">{message.message}</Typography>

								{message.attachmentUrl && (
									<Box
										component="img"
										src={message.attachmentUrl}
										alt="Attachment"
										sx={{ mt: 1, maxWidth: "100%", borderRadius: 1 }}
									/>
								)}
							</Paper>
						</Stack>
					);
				})}
			</Stack>

			<Stack direction="row" spacing={1}>
				<TextField
					fullWidth
					size="small"
					placeholder={disabled ? "This dispute is closed" : "Write a message..."}
					value={draft}
					disabled={disabled || sending}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							submit();
						}
					}}
				/>
				<IconButton
					color="primary"
					onClick={submit}
					disabled={disabled || sending || !draft.trim()}
					aria-label="Send message"
				>
					<Send />
				</IconButton>
			</Stack>
		</Stack>
	);
}
