function Icon({ children }: { children: React.ReactNode }) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			className="h-4 w-4"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			{children}
		</svg>
	);
}

export function BoldIcon() {
	return <Icon><path d="M7 5h6a4 4 0 0 1 0 8H7z" /><path d="M7 13h7a4 4 0 0 1 0 8H7z" /></Icon>;
}

export function ItalicIcon() {
	return <Icon><path d="M10 5h8M6 19h8M14 5 10 19" /></Icon>;
}

export function UnderlineIcon() {
	return <Icon><path d="M6 4v7a6 6 0 0 0 12 0V4M5 21h14" /></Icon>;
}

export function BulletedListIcon() {
	return <Icon><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></Icon>;
}

export function NumberedListIcon() {
	return <Icon><path d="M10 6h10M10 12h10M10 18h10M4 4h1v4M4 11h2l-2 3h2M4 17h2v3H4" /></Icon>;
}

export function LinkIcon() {
	return <Icon><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" /></Icon>;
}

export function ImageIcon() {
	return <Icon><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m21 15-5-5L5 20" /></Icon>;
}
