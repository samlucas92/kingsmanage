import type { MatchState } from "../../../../stores/match";
import StatusBadge from "../../../../components/compositions/StatusBadge";
import PanelCard from "../../../../components/compositions/PanelCard";
import { formatDisplayTime } from "../../../../utils/date";

interface MatchHeaderCardProps {
	teamName: string;
	opponent: string;
	date: string;
	venue: "home" | "away";
	location?: string;
	competition?: string;
	state: MatchState;
	isCompleted: boolean;
	onPostponeClick: () => void;
}

export function MatchHeaderCard({
	teamName,
	opponent,
	date,
	venue,
	location,
	competition,
	state,
	isCompleted,
	onPostponeClick,
}: MatchHeaderCardProps) {
	const matchDate = new Date(date);
	const weekday = matchDate.toLocaleDateString("en-GB", { weekday: "short" });
	const day = matchDate.toLocaleDateString("en-GB", { day: "numeric" });
	const month = matchDate.toLocaleDateString("en-GB", { month: "short" });

	return (
		<PanelCard>
			<div className="grid min-w-0 gap-4 sm:grid-cols-[76px_minmax(0,1fr)_auto] sm:items-center sm:gap-5">
				<div className="flex items-center gap-3 border-b border-slate-200 pb-4 sm:block sm:border-b-0 sm:border-r sm:pb-0 sm:pr-5 sm:text-center">
					<span className="text-xs font-black uppercase tracking-wide text-slate-500">
						{weekday}
					</span>
					<strong className="text-3xl font-black leading-none text-slate-950 sm:mt-1 sm:block">
						{day}
					</strong>
					<span className="text-xs font-bold text-slate-500 sm:mt-1 sm:block">
						{month} · {formatDisplayTime(date)}
					</span>
				</div>

				<div className="min-w-0">
					<p className="text-xs font-black uppercase tracking-[0.14em] text-yepset-700">
						{teamName}
					</p>
					<h1 className="mt-1 break-words text-xl font-black leading-tight text-slate-950 sm:text-2xl">
						<span className="mr-2 text-sm uppercase tracking-wide text-slate-400">vs</span>
						{opponent}
					</h1>
					<p className="mt-2 text-sm font-medium text-slate-500">
						{[
							location || (venue === "home" ? "Home venue" : "Away venue"),
							competition,
							venue === "home" ? "Home" : "Away",
						]
							.filter(Boolean)
							.join(" · ")}
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2 sm:max-w-44 sm:justify-end">
					<StatusBadge label={getStateLabel(state)} tone={getStateTone(state)} />
					{isCompleted && <StatusBadge label="Completed" tone="success" />}
					{!isCompleted && (
						<button
							type="button"
							onClick={onPostponeClick}
							className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:mt-1"
						>
							Postpone
						</button>
					)}
				</div>
			</div>
		</PanelCard>
	);
}

function getStateLabel(state: MatchState) {
	return state.charAt(0).toUpperCase() + state.slice(1);
}

function getStateTone(state: MatchState) {
	if (state === "won") {
		return "success";
	}

	if (state === "lost") {
		return "danger";
	}

	if (state === "draw") {
		return "neutral";
	}

	if (state === "postponed") {
		return "warning";
	}

	return "info";
}
