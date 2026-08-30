import { useNavigate } from "react-router-dom";

export default function NotFound() {
	const navigate = useNavigate();

	return (
		<div className="page-frame">
			<div
				style={{
					borderBottom: "2px solid var(--color-divider)",
					paddingBottom: 14,
					display: "flex",
					alignItems: "flex-end",
					gap: 18,
					animation: "fadeUp .4s ease both",
				}}
			>
				<span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-accent)", paddingBottom: 9 }}>
					404
				</span>
				<h1 style={{ margin: 0, fontSize: "clamp(32px, 8vw, 52px)", lineHeight: 0.92, letterSpacing: "-0.025em", textTransform: "uppercase" }}>
					Not found
				</h1>
			</div>
			<div className="text-muted" style={{ fontFamily: "var(--font-mono)", fontSize: 13, letterSpacing: "0.06em" }}>
				THIS PAGE ISN'T IN ESCROW · IT SIMPLY DOESN'T EXIST.
			</div>
			<div>
				<button className="btn btn-primary" onClick={() => navigate("/ads")}>
					Back to marketplace →
				</button>
			</div>
		</div>
	);
}
