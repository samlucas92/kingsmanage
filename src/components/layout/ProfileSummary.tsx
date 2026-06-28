import { Link } from "react-router-dom";

import { useAuthStore } from "../../stores/auth";

type ProfileSummaryProps = {
	compact?: boolean;
	iconOnlyOnMobile?: boolean;
	variant?: "light" | "dark";
};

export default function ProfileSummary({
	compact = false,
	iconOnlyOnMobile = false,
	variant = "dark",
}: ProfileSummaryProps) {
	const currentUser = useAuthStore((state) => state.currentUser);

	const roleLabel = currentUser?.role ?? "User";
	const email = currentUser?.email ?? "Signed in";
	const initials = getInitials(email);
	const isDark = variant === "dark";

	return (
		<Link
			to="/settings"
			className={`flex items-center rounded-lg transition ${
				iconOnlyOnMobile ? "gap-0 px-0 py-0 sm:gap-3 sm:px-2 sm:py-2" : `gap-3 ${compact ? "px-2 py-1.5" : "px-2 py-2"}`
			} ${
				isDark
					? "text-white hover:bg-white/10"
					: "text-slate-900 hover:bg-slate-100"
			}`}
			aria-label="Open account settings"
		>
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kick-400 text-sm font-black text-yepset-950 sm:h-9 sm:w-9">
				{initials}
			</div>

			<div className={`min-w-0 ${iconOnlyOnMobile ? "hidden sm:block" : "block"}`}>
				<div className="flex items-center gap-2">
					<p
						className={`truncate text-sm font-semibold ${
							isDark ? "text-white" : "text-slate-900"
						}`}
					>
						{roleLabel}
					</p>

					<span
						className={`shrink-0 ${
							isDark ? "text-blue-100" : "text-slate-400"
						}`}
						aria-hidden="true"
					>
						<SettingsOutlineIcon />
					</span>
				</div>

				<p
					className={`truncate text-xs ${
						isDark ? "text-blue-100" : "text-slate-500"
					}`}
				>
					{compact ? "Yepset" : email}
				</p>
			</div>
		</Link>
	);
}

function SettingsOutlineIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
			<path strokeLinecap="round" strokeLinejoin="round" d="M9.6 3.2 10 5a7.4 7.4 0 0 1 4 0l.4-1.8 2.2 1.3-1.3 1.3a7.3 7.3 0 0 1 2 3.5l1.8-.5v2.6l-1.8-.5a7.3 7.3 0 0 1-2 3.5l1.3 1.3-2.2 1.3-.4-1.8a7.4 7.4 0 0 1-4 0L9.6 17l-2.2-1.3 1.3-1.3a7.3 7.3 0 0 1-2-3.5l-1.8.5V8.8l1.8.5a7.3 7.3 0 0 1 2-3.5L7.4 4.5 9.6 3.2Z" />
			<circle cx="12" cy="10.1" r="2.4" />
		</svg>
	);
}

function getInitials(email: string) {
	const [name] = email.split("@");
	const parts = name.split(/[._-]/).filter(Boolean);

	if (parts.length >= 2) {
		return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
	}

	return name.slice(0, 2).toUpperCase();
}
