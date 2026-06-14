import { Link } from "react-router-dom";

import { useAuthStore } from "../../stores/auth";

type ProfileSummaryProps = {
	compact?: boolean;
	variant?: "light" | "dark";
};

export default function ProfileSummary({
	compact = false,
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
			className={`flex items-center gap-3 rounded-lg transition ${
				compact ? "px-2 py-1.5" : "px-2 py-2"
			} ${
				isDark
					? "text-white hover:bg-white/10"
					: "text-slate-900 hover:bg-slate-100"
			}`}
			aria-label="Open account settings"
		>
			<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-sm font-bold text-black">
				{initials}
			</div>

			<div className="min-w-0">
				<div className="flex items-center gap-2">
					<p
						className={`truncate text-sm font-semibold ${
							isDark ? "text-white" : "text-slate-900"
						}`}
					>
						{roleLabel}
					</p>

					<span
						className={`text-xs ${
							isDark ? "text-blue-100" : "text-slate-400"
						}`}
						aria-hidden="true"
					>
						⚙
					</span>
				</div>

				<p
					className={`truncate text-xs ${
						isDark ? "text-blue-100" : "text-slate-500"
					}`}
				>
					{compact ? "Kingsbridge Colts" : email}
				</p>
			</div>
		</Link>
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
