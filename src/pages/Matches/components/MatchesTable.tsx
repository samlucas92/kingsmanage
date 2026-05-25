import { Link } from "react-router-dom";
import type { ClubTeam, Match, MatchState } from "../../../stores/match";
import { formatDisplayDate, formatDisplayTime } from "../../../utils/date";
import EmptyState from "../../../components/compositions/EmptyState";
import DataTable from "../../../components/compositions/DataTable";
import StatusBadge from "../../../components/compositions/StatusBadge";

interface MatchesTableProps {
	matches: Match[];
	onEditMatch: (match: Match) => void;
	onPostponeMatch: (match: Match) => void;
	onRestoreMatch: (matchId: string) => void;
}

export function MatchesTable({
	matches,
	onEditMatch,
	onPostponeMatch,
	onRestoreMatch,
}: MatchesTableProps) {
	if (matches.length === 0) {
		return (
			<div className="overflow-hidden rounded-xl bg-white shadow">
				<div className="p-6">
					<EmptyState
						title="No matches found"
						message="There are no fixtures matching this view yet. Add a match or change your filter."
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-xl bg-white shadow">
			<div className="space-y-3 p-3 md:hidden">
				{matches.map((match) => (
					<MatchCard
						key={match.id}
						match={match}
						onEditMatch={onEditMatch}
						onPostponeMatch={onPostponeMatch}
						onRestoreMatch={onRestoreMatch}
					/>
				))}
			</div>

			<div className="hidden md:block">
				<DataTable minWidthClassName="min-w-[900px]">
					<thead className="border-b bg-gray-50">
						<tr className="text-left">
							<th className="p-3">Date</th>
							<th className="p-3">Team</th>
							<th className="p-3">Opponent</th>
							<th className="p-3">Venue</th>
							<th className="p-3">Result</th>
							<th className="p-3">State</th>
							<th className="p-3">Lineup</th>
							<th className="p-3 text-right">Actions</th>
						</tr>
					</thead>

					<tbody>
						{matches.map((match) => (
							<tr key={match.id} className="border-b hover:bg-gray-50">
								<td className="p-3">
									<div>
										<p className="font-medium text-slate-900">
											{formatDisplayDate(match.date)}
										</p>

										<p className="text-xs text-slate-500">
											{formatDisplayTime(match.date)}
										</p>
									</div>
								</td>

								<td className="p-3">
									<StatusBadge
										label={getTeamLabel(match.team)}
										tone={match.team === "first" ? "info" : "warning"}
									/>
								</td>

								<td className="p-3 font-medium">{match.opponent}</td>

								<td className="p-3 capitalize">{match.venue}</td>

								<td className="p-3">{getResultLabel(match)}</td>

								<td className="p-3">
									<StatusBadge
										label={getStateLabel(match.state)}
										tone={getStateTone(match.state)}
									/>
								</td>

								<td className="p-3">
									<StatusBadge
										label={match.isLineupLocked ? "Saved" : "Not saved"}
										tone={match.isLineupLocked ? "info" : "neutral"}
									/>
								</td>

								<td className="p-3">
									<div className="flex flex-wrap justify-end gap-2">
										<MatchActions
											match={match}
											onEditMatch={onEditMatch}
											onPostponeMatch={onPostponeMatch}
											onRestoreMatch={onRestoreMatch}
										/>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</DataTable>
			</div>
		</div>
	);
}

function MatchCard({
	match,
	onEditMatch,
	onPostponeMatch,
	onRestoreMatch,
}: {
	match: Match;
	onEditMatch: (match: Match) => void;
	onPostponeMatch: (match: Match) => void;
	onRestoreMatch: (matchId: string) => void;
}) {
	return (
		<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
						{formatDisplayDate(match.date)} · {formatDisplayTime(match.date)}
					</p>

					<h2 className="mt-1 truncate text-lg font-bold text-blue-900">
						vs {match.opponent}
					</h2>

					<p className="mt-1 text-sm capitalize text-slate-500">
						{match.venue}
					</p>
				</div>

				<div className="shrink-0 text-right">
					<p className="text-lg font-bold text-slate-900">
						{getResultLabel(match)}
					</p>
				</div>
			</div>

			<div className="mt-3 flex flex-wrap gap-2">
				<StatusBadge
					label={getTeamLabel(match.team)}
					tone={match.team === "first" ? "info" : "warning"}
				/>

				<StatusBadge
					label={getStateLabel(match.state)}
					tone={getStateTone(match.state)}
				/>

				<StatusBadge
					label={match.isLineupLocked ? "Lineup saved" : "Lineup not saved"}
					tone={match.isLineupLocked ? "info" : "neutral"}
				/>
			</div>

			<div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
				<MatchActions
					match={match}
					onEditMatch={onEditMatch}
					onPostponeMatch={onPostponeMatch}
					onRestoreMatch={onRestoreMatch}
					isMobile
				/>
			</div>
		</div>
	);
}

function MatchActions({
	match,
	onEditMatch,
	onPostponeMatch,
	onRestoreMatch,
	isMobile = false,
}: {
	match: Match;
	onEditMatch: (match: Match) => void;
	onPostponeMatch: (match: Match) => void;
	onRestoreMatch: (matchId: string) => void;
	isMobile?: boolean;
}) {
	const buttonClassName = isMobile
		? "rounded-lg border px-3 py-2 text-center text-sm font-medium hover:bg-gray-100"
		: "rounded-lg border px-3 py-1 text-sm hover:bg-gray-100";

	const viewClassName = isMobile
		? "rounded-lg border px-3 py-2 text-center text-sm font-medium text-blue-900 hover:bg-gray-100"
		: "rounded-lg border px-3 py-1 text-sm font-medium text-blue-900 hover:bg-gray-100";

	return (
		<>
			{!match.isCompleted && (
				<>
					<button
						type="button"
						onClick={() => onEditMatch(match)}
						className={buttonClassName}
					>
						Edit
					</button>

					{match.state === "postponed" ? (
						<button
							type="button"
							onClick={() => onRestoreMatch(match.id)}
							className={`${
								isMobile
									? "rounded-lg border border-green-200 px-3 py-2 text-center text-sm font-medium text-green-700 hover:bg-green-50"
									: "rounded-lg border border-green-200 px-3 py-1 text-sm text-green-700 hover:bg-green-50"
							}`}
						>
							Restore
						</button>
					) : (
						<button
							type="button"
							onClick={() => onPostponeMatch(match)}
							className={`${
								isMobile
									? "rounded-lg border border-amber-200 px-3 py-2 text-center text-sm font-medium text-amber-700 hover:bg-amber-50"
									: "rounded-lg border border-amber-200 px-3 py-1 text-sm text-amber-700 hover:bg-amber-50"
							}`}
						>
							Postpone
						</button>
					)}
				</>
			)}

			<Link to={`/matches/${match.id}`} className={viewClassName}>
				View
			</Link>
		</>
	);
}

function getTeamLabel(team: ClubTeam) {
	return team === "first" ? "First Team" : "Second Team";
}

function getResultLabel(match: Match) {
	if (!match.result) {
		return "-";
	}

	return `${match.result.homeGoals} - ${match.result.awayGoals}`;
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