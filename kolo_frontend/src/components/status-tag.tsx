interface StatusTagProps {
	label: string;
	color: string;
	fontSize?: number;
}

/** Solid inverted block chip: mono, 600, status color behind page-bg ink. */
export default function StatusTag({ label, color, fontSize = 10.5 }: StatusTagProps) {
	return (
		<span className="tag tag-status" style={{ background: color, fontSize }}>
			{label}
		</span>
	);
}
