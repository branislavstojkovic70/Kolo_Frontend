import { useEffect } from "react";

/**
 * Stamps the browser tab (and history/screen-reader context) with the page's
 * name. Used by <Page>, and directly by the screens that draw their own frame
 * (listing detail, 404).
 */
export function useDocumentTitle(title: string | undefined): void {
	useEffect(() => {
		if (!title) return;
		document.title = `${title} · Kolo`;
		return () => {
			document.title = "Kolo";
		};
	}, [title]);
}
