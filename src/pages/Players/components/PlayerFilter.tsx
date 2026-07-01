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
		<div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:p-4">
			<input
				value={searchTerm}
				onChange={(event) => onSearchTermChange(event.target.value)}
				placeholder="Search players..."
				className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-yepset-500"
			/>

			<select
				value={positionFilter}
				onChange={(event) => onPositionFilterChange(event.target.value)}
				className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-semibold text-slate-700 sm:w-auto"
			>
				<option value="all">All positions</option>

				{positions.map((position) => (
					<option key={position.key} value={position.key}>
						{position.key} · {position.label}
					</option>
				))}
			</select>

			<label className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-600">
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
