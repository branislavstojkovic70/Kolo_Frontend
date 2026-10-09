import type { CSSProperties, ImgHTMLAttributes } from "react";

interface Coverable {
	imageUrl: string | null;
	product: { imageUrl: string | null };
}

/**
 * A seller's own cover is photography; without one the listing falls back to
 * the catalogue's brand mark, which is shown as brand cover art instead.
 */
function listingCover(listing: Coverable) {
	const sellerCover = listing.imageUrl ?? null;
	const cover = sellerCover ?? listing.product.imageUrl ?? null;
	return { cover, isBrandMark: !sellerCover && !!cover };
}

interface ListingCoverProps {
	listing: Coverable;
	/** The frame's own class — `.brand-frame` is added on top for brand marks. */
	className?: string;
	style?: CSSProperties;
	alt?: string;
	imgProps?: ImgHTMLAttributes<HTMLImageElement>;
}

/** The frame for a listing's cover: a photo fills it, a brand mark becomes `.brand-frame` art. */
export default function ListingCover({ listing, className = "", style, alt = "", imgProps }: ListingCoverProps) {
	const { cover, isBrandMark } = listingCover(listing);
	return (
		<div
			className={isBrandMark ? `${className} brand-frame`.trim() : className}
			style={isBrandMark ? ({ ...style, "--brand-art": `url(${cover})` } as CSSProperties) : style}
		>
			{cover && <img src={cover} alt={alt} {...imgProps} />}
		</div>
	);
}
