import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/use-document-title";

export default function NotFound() {
	const navigate = useNavigate();
	useDocumentTitle("Page not found");

	return (
		<div className="page-frame">
			<div>
				<div className="text-muted" style={{ fontSize: 14 }}>
					Page not found
				</div>
				<h1 style={{ margin: "6px 0 0" }}>We can't find that page</h1>
			</div>
			<div className="text-muted" style={{ fontSize: 16, maxWidth: "min(52ch, 100%)" }}>
				The link may be out of date, or the listing it pointed to is no longer on sale.
			</div>
			<div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
				<button className="btn btn-primary" onClick={() => navigate("/ads")}>
					Back to browsing
				</button>
			</div>
		</div>
	);
}
