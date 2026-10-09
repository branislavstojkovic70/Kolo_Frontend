import { useThemeMode } from "../hooks/use-theme";
import { toggleThemeMode } from "../theme";
import { MoonIcon, SunIcon } from "./icons";

/**
 * Dark ⇄ light switch, wearing the same circular icon-button skin as the menu
 * and log-out buttons. Dark is the app's default; the choice is remembered in
 * localStorage and restored before the first paint.
 */
export default function ThemeToggle() {
	const mode = useThemeMode();
	const label = mode === "dark" ? "Switch to the light theme" : "Switch to the dark theme";

	return (
		<button
			type="button"
			className="btn btn-icon"
			onClick={() => toggleThemeMode()}
			title={label}
			aria-label={label}
			aria-pressed={mode === "light"}
		>
			{mode === "dark" ? <SunIcon size={17} /> : <MoonIcon size={17} />}
		</button>
	);
}
