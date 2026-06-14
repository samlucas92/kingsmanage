import { useAuthStore } from "../../stores/auth";

type ProfileSummaryProps = {
	compact?: boolean;
};

export default function ProfileSummary({ compact = false }: ProfileSummaryProps) {
	const currentUser = useAuthStore((state) => state.currentUser);

	const roleLabel = currentUser?.role ?? "User";
	const email = currentUser?.email ?? "Signed in";
	const initials = getInitials(email);

	return (
		<div className="flex items-center gap-3">
			<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-sm font-bold text-black">
				{initials}
			</div>
			{!compact && (
				<div className="min-w-0">
					<p className="truncate text-sm font-semibold text-slate-900 lg:text-white">{roleLabel}</p>
					<p className="truncate text-xs text-slate-500 lg:text-blue-100">{email}</p>
				</div>
			)}
			{compact && (
				<div className="min-w-0">
					<p className="truncate text-sm font-semibold text-slate-900">{roleLabel}</p>
					<p className="truncate text-xs text-slate-500">Kingsbridge Colts</p>
				</div>
			)}
		</div>
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
