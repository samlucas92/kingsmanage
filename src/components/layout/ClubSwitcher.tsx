import { useAuthStore } from "../../stores/auth";

type ClubSwitcherProps = {
	variant?: "light" | "dark";
};

export default function ClubSwitcher({ variant = "light" }: ClubSwitcherProps) {
	const clubs = useAuthStore((state) => state.availableClubs);
	const isSwitching = useAuthStore((state) => state.isSwitchingClub);
	const switchClub = useAuthStore((state) => state.switchClub);
	const currentClub = clubs.find((club) => club.isCurrent);

	if (clubs.length < 2 || !currentClub) return null;

	return (
		<label className={`relative block ${variant === "light" ? "hidden max-w-56 sm:block" : "w-full"}`}>
			<span className="sr-only">Active club</span>
			<select
				value={currentClub.id}
				disabled={isSwitching}
				onChange={(event) => void switchClub(event.target.value)}
				className={`h-11 w-full cursor-pointer appearance-none truncate rounded-xl py-2 pl-3 pr-8 text-sm font-bold outline-none transition disabled:cursor-wait disabled:opacity-60 ${
					variant === "dark"
						? "border border-white/15 bg-white/8 text-white focus:border-kick-300 focus:ring-2 focus:ring-kick-300/20"
						: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-yepset-200 focus:border-yepset-400 focus:ring-2 focus:ring-yepset-100"
				}`}
			>
				{clubs.map((club) => (
					<option key={club.id} value={club.id}>
						{club.name}
					</option>
				))}
			</select>
			<span className={`pointer-events-none absolute inset-y-0 right-2 grid place-items-center text-xs ${variant === "dark" ? "text-white/70" : "text-slate-500"}`}>⌄</span>
		</label>
	);
}
