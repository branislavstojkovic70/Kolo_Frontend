import type { ReactNode } from "react";
import { useDocumentTitle } from "../hooks/use-document-title";

interface PageProps {
	title: string;
	/** One quiet line under the title. */
	sub: string;
	children: ReactNode;
}

/** Content frame: page title at 28/700, a muted subtitle, then the sections. */
export default function Page({ title, sub, children }: PageProps) {
	useDocumentTitle(title);

	return (
		<div className="page-frame">
			<div>
				<h1 style={{ margin: 0 }}>{title}</h1>
				<div className="text-muted" style={{ fontSize: 16, marginTop: 4 }}>
					{sub}
				</div>
			</div>
			{children}
		</div>
	);
}
