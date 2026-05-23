import { useSeasonStore } from "../../stores/seasons";

type SeasonSelectorProps = {
	label?: string;
	disabled?: boolean;
	className?: string;
	selectClassName?: string;
};

export default function SeasonSelector({
	label = "Selected season",
	disabled = false,
	className = "",
	selectClassName = "",
}: SeasonSelectorProps) {
	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const setActiveSeason = useSeasonStore((state) => state.setActiveSeason);

	const hasSeasons = seasons.length > 0;
	const selectedSeasonExists = seasons.some(
		(season) => season.id === activeSeasonId
	);

	const value = selectedSeasonExists ? activeSeasonId : "";

	return (
		<label className={`block shrink-0 ${className}`}>
			<span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
				{label}
			</span>

			<select
				value={value}
				onChange={(event) => {
					if (!event.target.value) {
						return;
					}

					setActiveSeason(event.target.value);
				}}
				disabled={disabled || !hasSeasons}
				className={`min-w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${selectClassName}`}
			>
				{!hasSeasons && <option value="">No seasons available</option>}

				{hasSeasons && !selectedSeasonExists && (
					<option value="">Select a season</option>
				)}

				{seasons.map((season) => (
					<option key={season.id} value={season.id}>
						{season.name}
					</option>
				))}
			</select>
		</label>
	);
}