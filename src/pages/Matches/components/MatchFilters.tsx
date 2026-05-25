import type { MatchState, ClubTeam } from "../../../stores/match";
import PanelCard from "../../../components/compositions/PanelCard";
import FilterButton from "../../../components/compositions/FilterButton";

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
	teamCounts: {
		all: number;
		first: number;
		second: number;
	};
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

const teamFilterOptions: {
	label: string;
	value: MatchTeamFilter;
}[] = [
	{
		label: "All Teams",
		value: "all",
	},
	{
		label: "First Team",
		value: "first",
	},
	{
		label: "Second Team",
		value: "second",
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
	return (
		<PanelCard contentClassName="space-y-4">
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
							count={teamCounts[option.value]}
							onChange={onTeamFilterChange}
						/>
					))}
				</div>
			</div>
		</PanelCard>
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