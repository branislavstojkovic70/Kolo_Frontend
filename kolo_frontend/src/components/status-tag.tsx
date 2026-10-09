import type { CSSProperties } from "react";

interface StatusTagProps {
	label: string;
	color: string;
	fontSize?: number;
}

/**
 * Soft status pill: a 12% tint of the status colour behind the status colour
 * as ink. The colour travels as a custom property so the tint is mixed in CSS.
 */
export default function StatusTag({ label, color, fontSize = 11 }: StatusTagProps) {
	return (
		<span className="tag tag-status" style={{ "--chip": color, fontSize } as CSSProperties}>
			{label}
		</span>
	);
}
