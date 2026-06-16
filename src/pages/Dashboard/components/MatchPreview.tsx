import StatusBadge from "../../../components/compositions/StatusBadge";
import type { Match, MatchState } from "../../../stores/match";
import { formatDisplayDateTime } from "../../../utils/date";
import {
	getMatchStatusLabel,
	getMatchStatusTone,
	getTeamLabel,
	getVenueLabel,
} from "../../../utils/matches";

export default function MatchPreview({ match, showResult = false }: { match: Match; showResult?: boolean }) {
	return (
		<div>
			<div className="flex flex-wrap items-center gap-2">
				<p className="text-lg font-bold text-slate-900">vs {match.opponent}</p>
				<StatusPill state={match.state} />
				{showResult && match.result && <ResultPill match={match} />}
			</div>

			<p className="mt-2 text-sm text-slate-600">
				{formatDisplayDateTime(match.date)} · {getVenueLabel(match.venue)} · {getTeamLabel(match.team)}
			</p>
		</div>
	);
}

export function MatchListItem({ match, showResult = false }: { match: Match; showResult?: boolean }) {
	return (
		<div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
			<div>
				<p className="font-bold text-slate-900">vs {match.opponent}</p>
				<p className="mt-1 text-sm text-slate-500">
					{formatDisplayDateTime(match.date)} · {getVenueLabel(match.venue)} · {getTeamLabel(match.team)}
				</p>
			</div>

			<div className="flex shrink-0 items-center gap-2">
				<StatusPill state={match.state} />
				{showResult && match.result && <ResultPill match={match} />}
			</div>
		</div>
	);
}

function StatusPill({ state }: { state: MatchState }) {
	return (
		<StatusBadge
			label={getMatchStatusLabel(state)}
			tone={getMatchStatusTone(state)}
		/>
	);
}

function ResultPill({ match }: { match: Match }) {
	if (!match.result) {
		return null;
	}

	return (
		<span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-900">
			{match.result.homeGoals} - {match.result.awayGoals}
		</span>
	);
}
