import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../stores/auth";

export default function AccountMenu() {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const navigate = useNavigate();
	const currentUser = useAuthStore((state) => state.currentUser);
	const logout = useAuthStore((state) => state.logout);
	const email = currentUser?.email ?? "Signed in";
	const role = currentUser?.role ?? "User";

	useEffect(() => {
		function closeMenu(event: MouseEvent) {
			if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
		}

		function closeOnEscape(event: KeyboardEvent) {
			if (event.key === "Escape") setIsOpen(false);
		}

		if (isOpen) {
			window.addEventListener("mousedown", closeMenu);
			window.addEventListener("keydown", closeOnEscape);
		}

		return () => {
			window.removeEventListener("mousedown", closeMenu);
			window.removeEventListener("keydown", closeOnEscape);
		};
	}, [isOpen]);

	function handleSignOut() {
		logout();
		setIsOpen(false);
		navigate("/login", { replace: true });
	}

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={() => setIsOpen((current) => !current)}
				className="flex items-center gap-3 rounded-lg p-1 text-left transition hover:bg-slate-100 sm:py-1 sm:pl-1 sm:pr-2"
				aria-label="Open profile menu"
				aria-expanded={isOpen}
			>
				<span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-yellow-400 text-sm font-bold text-black sm:h-9 sm:w-9">
					{getInitials(email)}
				</span>
				<span className="hidden min-w-0 sm:block">
					<span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
						{role}
						<SettingsOutlineIcon />
					</span>
					<span className="block max-w-48 truncate text-xs text-slate-500">{email}</span>
				</span>
			</button>

			{isOpen && (
				<div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
					<div className="border-b border-slate-100 px-4 py-3 sm:hidden">
						<p className="text-sm font-bold text-slate-900">{role}</p>
						<p className="truncate text-xs text-slate-500">{email}</p>
					</div>
					<Link
						to="/settings"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
					>
						<SettingsOutlineIcon />
						Settings
					</Link>
					<button
						type="button"
						onClick={handleSignOut}
						className="flex w-full items-center px-4 py-2.5 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
					>
						Sign out
					</button>
				</div>
			)}
		</div>
	);
}

function SettingsOutlineIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true">
			<path strokeLinecap="round" strokeLinejoin="round" d="M9.6 3.2 10 5a7.4 7.4 0 0 1 4 0l.4-1.8 2.2 1.3-1.3 1.3a7.3 7.3 0 0 1 2 3.5l1.8-.5v2.6l-1.8-.5a7.3 7.3 0 0 1-2 3.5l1.3 1.3-2.2 1.3-.4-1.8a7.4 7.4 0 0 1-4 0L9.6 17l-2.2-1.3 1.3-1.3a7.3 7.3 0 0 1-2-3.5l-1.8.5V8.8l1.8.5a7.3 7.3 0 0 1 2-3.5L7.4 4.5 9.6 3.2Z" />
			<circle cx="12" cy="10.1" r="2.4" />
		</svg>
	);
}

function getInitials(email: string) {
	const [name] = email.split("@");
	const parts = name.split(/[._-]/).filter(Boolean);
	return (parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2)).toUpperCase();
}
