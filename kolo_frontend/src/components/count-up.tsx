import { useEffect, useState } from "react";

/** Counts from 0 on mount — ~950ms, cubic ease-out, per the handoff timing spec. */
export default function CountUp({ to, dec = 0 }: { to: number; dec?: number }) {
	const [value, setValue] = useState(0);

	useEffect(() => {
		const start = performance.now();
		const duration = 950;
		let raf: number;

		const tick = (now: number) => {
			const progress = Math.min(1, (now - start) / duration);
			setValue(to * (1 - Math.pow(1 - progress, 3)));
			if (progress < 1) raf = requestAnimationFrame(tick);
		};

		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [to]);

	return (
		<>
			{value.toLocaleString("en-US", {
				minimumFractionDigits: dec,
				maximumFractionDigits: dec,
			})}
		</>
	);
}
