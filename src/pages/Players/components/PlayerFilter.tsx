import { getSportDefinition } from "../../../constants/sports";
import { useAuthStore } from "../../../stores/auth";

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
	const activeClub = useAuthStore((state) => state.availableClubs.find((club) => club.isCurrent));
	const positions = getSportDefinition(activeClub?.sportKey).positions;
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

				{positions.map((position) => (
					<option key={position.key} value={position.key}>
						{position.key} · {position.label}
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
