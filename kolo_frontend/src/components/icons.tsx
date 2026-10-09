import type { CSSProperties, ReactNode } from "react";

interface IconProps {
	size?: number;
	strokeWidth?: number;
	style?: CSSProperties;
	className?: string;
}

function icon(children: ReactNode) {
	return function Icon({ size = 16, strokeWidth = 2, style, className }: IconProps) {
		return (
			<svg
				width={size}
				height={size}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeLinecap="round"
				strokeLinejoin="round"
				style={style}
				className={className}
				aria-hidden="true"
			>
				{children}
			</svg>
		);
	};
}

export const SearchIcon = icon(
	<>
		<circle cx="11" cy="11" r="7" />
		<path d="m20 20-3.2-3.2" />
	</>
);

export const MessageIcon = icon(
	<path d="M21 11.5a8.38 8.38 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.1A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z" />
);

export const LockIcon = icon(
	<>
		<rect x="3" y="11" width="18" height="11" rx="2" />
		<path d="M7 11V7a5 5 0 0 1 10 0v4" />
	</>
);

export const StoreIcon = icon(
	<>
		<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
		<path d="M3 6h18" />
		<path d="M16 10a4 4 0 0 1-8 0" />
	</>
);

export const FileTextIcon = icon(
	<>
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
		<path d="M14 2v6h6" />
		<path d="M16 13H8" />
		<path d="M16 17H8" />
	</>
);

export const ShieldAlertIcon = icon(
	<>
		<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
		<path d="M12 8v4" />
		<path d="M12 16h.01" />
	</>
);

export const ShieldCheckIcon = icon(
	<>
		<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
		<path d="m9 12 2 2 4-4" />
	</>
);

export const BellIcon = icon(
	<>
		<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
		<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
	</>
);

export const WalletIcon = icon(
	<>
		<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
		<path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
		<path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
	</>
);

export const LogOutIcon = icon(
	<>
		<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
		<path d="M16 17l5-5-5-5" />
		<path d="M21 12H9" />
	</>
);

export const PlusIcon = icon(
	<>
		<path d="M5 12h14" />
		<path d="M12 5v14" />
	</>
);

export const ArrowLeftIcon = icon(
	<>
		<path d="m12 19-7-7 7-7" />
		<path d="M19 12H5" />
	</>
);

export const CheckIcon = icon(<path d="M20 6 9 17l-5-5" />);

export const CopyIcon = icon(
	<>
		<rect x="9" y="9" width="13" height="13" />
		<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
	</>
);

export const PaperclipIcon = icon(
	<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
);

export const SendIcon = icon(
	<>
		<path d="M22 2 11 13" />
		<path d="M22 2 15 22l-4-9-9-4z" />
	</>
);

export const HourglassIcon = icon(
	<>
		<path d="M5 22h14" />
		<path d="M5 2h14" />
		<path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 18.828V22" />
		<path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
	</>
);

export const BanknoteIcon = icon(
	<>
		<rect x="2" y="6" width="20" height="12" />
		<circle cx="12" cy="12" r="2" />
		<path d="M6 12h.01" />
		<path d="M18 12h.01" />
	</>
);

export const ExternalLinkIcon = icon(
	<>
		<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
		<path d="M15 3h6v6" />
		<path d="M10 14 21 3" />
	</>
);

export const PencilIcon = icon(
	<>
		<path d="M12 20h9" />
		<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
	</>
);

export const TrashIcon = icon(
	<>
		<path d="M3 6h18" />
		<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
		<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
		<path d="M10 11v6" />
		<path d="M14 11v6" />
	</>
);

export const PauseIcon = icon(
	<>
		<rect x="6" y="4" width="4" height="16" />
		<rect x="14" y="4" width="4" height="16" />
	</>
);

export const PlayIcon = icon(<path d="m6 3 14 9-14 9z" />);

export const MenuIcon = icon(
	<>
		<path d="M4 6h16" />
		<path d="M4 12h16" />
		<path d="M4 18h16" />
	</>
);

/* The theme switch shows the destination, not the current state: a sun while
   you are in the dark theme, a moon while you are in the light one. */

export const SunIcon = icon(
	<>
		<circle cx="12" cy="12" r="4" />
		<path d="M12 2v2" />
		<path d="M12 20v2" />
		<path d="M4.9 4.9l1.4 1.4" />
		<path d="M17.7 17.7l1.4 1.4" />
		<path d="M2 12h2" />
		<path d="M20 12h2" />
		<path d="M4.9 19.1l1.4-1.4" />
		<path d="M17.7 6.3l1.4-1.4" />
	</>
);

export const MoonIcon = icon(<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />);
