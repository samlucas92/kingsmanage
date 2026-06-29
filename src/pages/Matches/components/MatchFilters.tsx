import type { MatchState, ClubTeam } from "../../../stores/match";
import PanelCard from "../../../components/compositions/PanelCard";
import FilterButton from "../../../components/compositions/FilterButton";
import { useClubTeamStore } from "../../../stores/clubTeams";

export type MatchFilter = "all" | "upcoming" | "completed" | "postponed";
export type MatchTeamFilter = "all" | ClubTeam;

interface MatchFiltersProps {
	activeFilter: MatchFilter;
	activeTeamFilter: MatchTeamFilter;
	counts: {
		all: number;
		upcoming: number;
		completed: number;
		postponed: number;
	};
	teamCounts: Record<string, number>;
	onFilterChange: (filter: MatchFilter) => void;
	onTeamFilterChange: (filter: MatchTeamFilter) => void;
}

const filterOptions: {
	label: string;
	value: MatchFilter;
}[] = [
	{
		label: "All",
		value: "all",
	},
	{
		label: "Upcoming",
		value: "upcoming",
	},
	{
		label: "Completed",
		value: "completed",
	},
	{
		label: "Postponed",
		value: "postponed",
	},
];

export function MatchFilters({
	activeFilter,
	activeTeamFilter,
	counts,
	teamCounts,
	onFilterChange,
	onTeamFilterChange,
}: MatchFiltersProps) {
	const profiles = useClubTeamStore((state) => state.profiles);
	const teamFilterOptions: { label: string; value: MatchTeamFilter }[] = [
		{ label: "All Teams", value: "all" },
		...profiles.map((profile) => ({ label: profile.displayName, value: profile.id })),
	];

	return (
		<>
			<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
				<div className="grid grid-cols-4 border-b border-slate-200">
					{filterOptions.map((option) => {
						const isActive = option.value === activeFilter;

						return (
							<button
								key={option.value}
								type="button"
								onClick={() => onFilterChange(option.value)}
								className={`relative min-h-12 px-1 text-[11px] font-black ${
									isActive ? "text-yepset-800" : "text-slate-500"
								}`}
							>
								{option.label}
								<span className="ml-1 text-[9px] text-slate-400">
									{counts[option.value]}
								</span>
								{isActive && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-kick-500" />}
							</button>
						);
					})}
				</div>

				<label className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs font-bold text-slate-500">
					<span>Team</span>
					<select
						value={activeTeamFilter}
						onChange={(event) => onTeamFilterChange(event.target.value as MatchTeamFilter)}
						className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-800"
					>
						{teamFilterOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label} ({teamCounts[option.value] ?? 0})
							</option>
						))}
					</select>
				</label>
			</div>

		<PanelCard className="hidden lg:block" contentClassName="space-y-4">
			<div>
				<p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
					Status
				</p>

				<div className="flex flex-wrap gap-2">
					{filterOptions.map((option) => (
						<FilterButton
							key={option.value}
							label={option.label}
							value={option.value}
							activeValue={activeFilter}
							count={counts[option.value]}
							onChange={onFilterChange}
						/>
					))}
				</div>
			</div>

			<div>
				<p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
					Team
				</p>

				<div className="flex flex-wrap gap-2">
					{teamFilterOptions.map((option) => (
						<FilterButton
							key={option.value}
							label={option.label}
							value={option.value}
							activeValue={activeTeamFilter}
							count={teamCounts[option.value] ?? 0}
							onChange={onTeamFilterChange}
						/>
					))}
				</div>
			</div>
		</PanelCard>
		</>
	);
}

export function getMatchFilterFromState(
	state: MatchState,
	isCompleted: boolean
): MatchFilter {
	if (state === "postponed") {
		return "postponed";
	}

	if (isCompleted) {
		return "completed";
	}

	return "upcoming";
}
