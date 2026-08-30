interface BlockAvatarProps {
	name: string | null | undefined;
	imageUrl?: string | null;
	size?: number;
	fontSize?: number;
}

/** Hard-edged square avatar: seller image when present, heading-weight initial otherwise. */
export default function BlockAvatar({ name, imageUrl, size = 32, fontSize = 14 }: BlockAvatarProps) {
	const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";

	if (imageUrl) {
		return (
			<img
				src={imageUrl}
				alt={name ?? ""}
				style={{ width: size, height: size, flex: "none", objectFit: "cover" }}
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
				background: "var(--color-neutral-300)",
				fontFamily: "var(--font-heading)",
				fontWeight: 800,
				fontSize,
			}}
		>
			{initial}
		</div>
	);
}
