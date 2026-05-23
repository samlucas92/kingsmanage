import type { MatchState, ClubTeam } from "../../../stores/match";

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
		<div className="space-y-4 rounded-xl bg-white p-4 shadow">
			<div>
				<p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
					Status
				</p>

				<div className="flex flex-wrap gap-2">
					{filterOptions.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => onFilterChange(option.value)}
							className={`rounded-full border px-4 py-2 text-sm font-semibold ${
								activeFilter === option.value
									? "border-blue-700 bg-blue-700 text-white"
									: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
							}`}
						>
							{option.label}{" "}
							<span
								className={`ml-1 ${
									activeFilter === option.value
										? "text-blue-100"
										: "text-slate-400"
								}`}
							>
								{counts[option.value]}
							</span>
						</button>
					))}
				</div>
			</div>

			<div>
				<p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
					Team
				</p>

				<div className="flex flex-wrap gap-2">
					{teamFilterOptions.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => onTeamFilterChange(option.value)}
							className={`rounded-full border px-4 py-2 text-sm font-semibold ${
								activeTeamFilter === option.value
									? "border-yellow-400 bg-yellow-400 text-slate-950"
									: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
							}`}
						>
							{option.label}{" "}
							<span
								className={`ml-1 ${
									activeTeamFilter === option.value
										? "text-slate-700"
										: "text-slate-400"
								}`}
							>
								{teamCounts[option.value]}
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
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