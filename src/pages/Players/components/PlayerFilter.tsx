import { getSportDefinition } from "../../../constants/sports";
import { useAuthStore } from "../../../stores/auth";
import type { PlayerStatusFilter, PlayersViewMode } from "../playersViewModel";

type Props = {
	searchTerm: string;
	positionFilter: string;
	statusFilter: PlayerStatusFilter;
	viewMode: PlayersViewMode;
	onSearchTermChange: (value: string) => void;
	onPositionFilterChange: (value: string) => void;
	onStatusFilterChange: (value: PlayerStatusFilter) => void;
	onViewModeChange: (value: PlayersViewMode) => void;
};

export function PlayersFilters({
	searchTerm,
	positionFilter,
	statusFilter,
	viewMode,
	onSearchTermChange,
	onPositionFilterChange,
	onStatusFilterChange,
	onViewModeChange,
}: Props) {
	const activeClub = useAuthStore((state) => state.availableClubs.find((club) => club.isCurrent));
	const positions = getSportDefinition(activeClub?.sportKey).positions;

	return (
		<section aria-label="Player filters" className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
			<div className="grid gap-3 xl:grid-cols-[minmax(15rem,1fr)_minmax(11rem,auto)_minmax(11rem,auto)_auto] xl:items-center">
				<label className="relative block">
					<span className="sr-only">Search players</span>
					<SearchIcon />
					<input
						value={searchTerm}
						onChange={(event) => onSearchTermChange(event.target.value)}
						placeholder="Search players…"
						className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-yepset-500 focus:bg-white focus:ring-4 focus:ring-yepset-100"
					/>
				</label>

				<label>
					<span className="sr-only">Filter by position</span>
					<select value={positionFilter} onChange={(event) => onPositionFilterChange(event.target.value)} className={selectClassName}>
						<option value="all">All positions</option>
						{positions.map((position) => <option key={position.key} value={position.key}>{position.key} · {position.label}</option>)}
					</select>
				</label>

				<label>
					<span className="sr-only">Filter by active status</span>
					<select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as PlayerStatusFilter)} className={selectClassName}>
						<option value="active">Active players</option>
						<option value="inactive">Inactive players</option>
						<option value="all">All statuses</option>
					</select>
				</label>

				<div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" aria-label="Player view" role="group">
					<ViewButton active={viewMode === "cards"} label="Cards" onClick={() => onViewModeChange("cards")} icon="cards" />
					<ViewButton active={viewMode === "list"} label="List" onClick={() => onViewModeChange("list")} icon="list" />
				</div>
			</div>
		</section>
	);
}

const selectClassName = "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-yepset-500 focus:ring-4 focus:ring-yepset-100";

function ViewButton({ active, icon, label, onClick }: { active: boolean; icon: "cards" | "list"; label: string; onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition ${active ? "bg-yepset-700 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
		>
			{icon === "cards" ? <CardsIcon /> : <ListIcon />}
			{label}
		</button>
	);
}

function SearchIcon() {
	return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}

function CardsIcon() {
	return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
}

function ListIcon() {
	return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></svg>;
}
