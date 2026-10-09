interface BlockAvatarProps {
	name: string | null | undefined;
	imageUrl?: string | null;
	size?: number;
	fontSize?: number;
}

/** Round avatar: profile image when present, a quiet initial otherwise. */
export default function BlockAvatar({ name, imageUrl, size = 32, fontSize = 14 }: BlockAvatarProps) {
	const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";

	if (imageUrl) {
		return (
			<img
				src={imageUrl}
				alt={name ?? ""}
				style={{
					width: size,
					height: size,
					flex: "none",
					objectFit: "cover",
					borderRadius: "var(--r-pill)",
				}}
			/>
		);
	}

	return (
		<div
			style={{
				width: size,
				height: size,
				flex: "none",
				display: "grid",
				placeItems: "center",
				background: "var(--surface-strong)",
				color: "var(--body-soft)",
				borderRadius: "var(--r-pill)",
				fontWeight: 600,
				fontSize,
			}}
		>
			{initial}
		</div>
	);
}
