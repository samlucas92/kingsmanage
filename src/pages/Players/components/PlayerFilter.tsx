import { PLAYER_POSITIONS } from "../../../constants/positions";

interface PlayersFiltersProps {
	searchTerm: string;
	positionFilter: string;
	includeInactive: boolean;
	onSearchTermChange: (value: string) => void;
	onPositionFilterChange: (value: string) => void;
	onIncludeInactiveChange: (value: boolean) => void;
}

export function PlayersFilters({
	searchTerm,
	positionFilter,
	includeInactive,
	onSearchTermChange,
	onPositionFilterChange,
	onIncludeInactiveChange,
}: PlayersFiltersProps) {
	return (
		<div className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow">
			<input
				value={searchTerm}
				onChange={(event) => onSearchTermChange(event.target.value)}
				placeholder="Search players..."
				className="min-w-64 rounded-lg border px-3 py-2"
			/>

			<select
				value={positionFilter}
				onChange={(event) => onPositionFilterChange(event.target.value)}
				className="rounded-lg border px-3 py-2"
			>
				<option value="all">All positions</option>

				{PLAYER_POSITIONS.map((position) => (
					<option key={position} value={position}>
						{position}
					</option>
				))}
			</select>

			<label className="flex items-center gap-2 text-sm">
				<input
					type="checkbox"
					checked={includeInactive}
					onChange={(event) =>
						onIncludeInactiveChange(event.target.checked)
					}
				/>
				Include inactive players
			</label>
		</div>
	);
}