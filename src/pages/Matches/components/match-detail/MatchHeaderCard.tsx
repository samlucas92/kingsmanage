import type { MatchState } from "../../../../stores/match";
import StatusBadge from "../../../../components/compositions/StatusBadge";
import PanelCard from "../../../../components/compositions/PanelCard";
import { formatDisplayDateTime } from "../../../../utils/date";

interface MatchHeaderCardProps {
	opponent: string;
	date: string;
	venue: "home" | "away";
	state: MatchState;
	isCompleted: boolean;
	onPostponeClick: () => void;
}

export function MatchHeaderCard({
	opponent,
	date,
	venue,
	state,
	isCompleted,
	onPostponeClick,
}: MatchHeaderCardProps) {
	return (
		<PanelCard>
			<div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0">
					<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
						Match detail
					</p>

					<h1 className="mt-1 truncate text-2xl font-bold text-blue-900 sm:text-3xl">
						vs {opponent}
					</h1>

					<p className="mt-1 text-sm text-gray-600 sm:text-base">
						{formatDisplayDateTime(date)} ·{" "}
						<span className="capitalize">{venue}</span>
					</p>

					<div className="mt-3 flex flex-wrap items-center gap-2">
						<StatusBadge label={getStateLabel(state)} tone={getStateTone(state)} />

						<StatusBadge
							label={venue === "home" ? "Home" : "Away"}
							tone={venue === "home" ? "info" : "warning"}
						/>

						{isCompleted && <StatusBadge label="Completed" tone="success" />}
					</div>
				</div>

				{!isCompleted && (
					<button
						type="button"
						onClick={onPostponeClick}
						className="w-full rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 sm:w-auto"
					>
						Postpone
					</button>
				)}
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