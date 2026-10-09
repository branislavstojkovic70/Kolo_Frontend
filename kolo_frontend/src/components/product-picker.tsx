import { useMemo } from "react";
import type { Product } from "../api";
import { money } from "../utils/money";

interface ProductPickerProps {
	id: string;
	label: string;
	products: Product[] | undefined;
	/** Selected product id, or "" for nothing picked yet. */
	value: string;
	onChange: (productId: string) => void;
	disabled?: boolean;
	/** One quiet line under the control. */
	hint?: string;
	/** Validation message; replaces the hint and marks the control invalid. */
	error?: string;
	/** Catalogue fetch error; the picker shows it with a retry instead of loading forever. */
	loadError?: string;
	onRetryLoad?: () => void;
}

/**
 * The catalogue dropdown. Sellers and deal-alert buyers both pick a product
 * here — free-text titles are gone, so this is the only way into either form.
 * Options are grouped by category and carry the official retail price, which is
 * the number the seller is undercutting.
 */
export default function ProductPicker({
	id,
	label,
	products,
	value,
	onChange,
	disabled = false,
	hint,
	error,
	loadError,
	onRetryLoad,
}: ProductPickerProps) {
	// The API already sorts by category then name, so grouping is a single pass.
	const groups = useMemo(() => {
		const byCategory = new Map<string, Product[]>();
		for (const product of products ?? []) {
			const bucket = byCategory.get(product.category);
			if (bucket) bucket.push(product);
			else byCategory.set(product.category, [product]);
		}
		return [...byCategory];
	}, [products]);

	return (
		<div className="field" style={{ minWidth: 0 }}>
			<label htmlFor={id}>{label}</label>
			{/* A `<select>` is as wide as its widest option whatever its `width` says,
			    and an option here is a product name plus its retail price. Capping it
			    at the column keeps the form off the page's horizontal scrollbar; the
			    picked line then ellipsises instead of pushing. */}
			<select
				id={id}
				className="input"
				style={{
					minWidth: 0,
					maxWidth: "100%",
					textOverflow: "ellipsis",
					borderColor: error ? "var(--error)" : undefined,
				}}
				value={value}
				disabled={disabled || !products}
				aria-invalid={error ? true : undefined}
				onChange={(e) => onChange(e.target.value)}
			>
				<option value="">
					{products
						? "Choose a subscription…"
						: loadError
							? "The catalogue didn't load"
							: "Loading the catalogue…"}
				</option>
				{groups.map(([category, items]) => (
					<optgroup key={category} label={category}>
						{items.map((product) => (
							<option key={product.id} value={product.id}>
								{product.name} - {money(product.retailPriceUsd)} retail
							</option>
						))}
					</optgroup>
				))}
			</select>
			{!products && loadError ? (
				<span role="alert" style={{ fontSize: 13, color: "var(--error)" }}>
					{loadError}{" "}
					{onRetryLoad && (
						<button
							type="button"
							className="btn btn-ghost btn-sm"
							style={{ minHeight: 28, padding: "0 6px" }}
							onClick={onRetryLoad}
						>
							Try again
						</button>
					)}
				</span>
			) : error ? (
				<span role="alert" style={{ fontSize: 13, color: "var(--error)" }}>
					{error}
				</span>
			) : (
				hint && (
					<span className="text-muted" style={{ fontSize: 13 }}>
						{hint}
					</span>
				)
			)}
		</div>
	);
}
