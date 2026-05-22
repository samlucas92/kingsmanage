import type { MatchState } from "../../../stores/match";

export type MatchFilter = "all" | "upcoming" | "completed" | "postponed";

interface MatchFiltersProps {
	activeFilter: MatchFilter;
	counts: {
		all: number;
		upcoming: number;
		completed: number;
		postponed: number;
	};
	onFilterChange: (filter: MatchFilter) => void;
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
	counts,
	onFilterChange,
}: MatchFiltersProps) {
	return (
		<div className="flex flex-wrap gap-2 rounded-xl bg-white p-4 shadow">
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