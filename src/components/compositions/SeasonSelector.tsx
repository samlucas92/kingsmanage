import { useSeasonStore } from "../../stores/seasons";

type SeasonSelectorProps = {
	label?: string;
	selectedSeasonId: string;
	onSeasonChange: (seasonId: string) => void;
	disabled?: boolean;
	className?: string;
	selectClassName?: string;
	showActiveLabel?: boolean;
};

export default function SeasonSelector({
	label = "Season filter",
	selectedSeasonId,
	onSeasonChange,
	disabled = false,
	className = "",
	selectClassName = "",
	showActiveLabel = false,
}: SeasonSelectorProps) {
	const seasons = useSeasonStore((state) => state.seasons);

	const hasSeasons = seasons.length > 0;
	const selectedSeasonExists = seasons.some(
		(season) => season.id === selectedSeasonId
	);

	const value = selectedSeasonExists ? selectedSeasonId : "";

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

					onSeasonChange(event.target.value);
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
						{season.name}{showActiveLabel && season.isActive ? " (current)" : ""}
					</option>
				))}
			</select>
		</label>
	);
}
