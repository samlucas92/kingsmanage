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
				className={`h-10 w-full cursor-pointer appearance-none truncate rounded-lg py-2 pl-3 pr-8 text-sm font-semibold outline-none transition disabled:cursor-wait disabled:opacity-60 ${
					variant === "dark"
						? "border border-white/20 bg-blue-900 text-white focus:border-yellow-300 focus:ring-2 focus:ring-yellow-300/20"
						: "border border-slate-300 bg-white text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
