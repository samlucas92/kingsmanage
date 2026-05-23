import { Link } from "react-router-dom";
import type { ClubTeam, Match } from "../../../stores/match";
import { formatDisplayDate, formatDisplayTime } from "../../../utils/date";
import EmptyState from "../../../components/compositions/EmptyState";

interface MatchesTableProps {
	matches: Match[];
	onEditMatch: (match: Match) => void;
	onPostponeMatch: (match: Match) => void;
	onRestoreMatch: (matchId: string) => void;
}

function getTeamLabel(team: ClubTeam) {
	return team === "first" ? "First Team" : "Second Team";
}

function getTeamBadgeClass(team: ClubTeam) {
	return team === "first"
		? "bg-blue-100 text-blue-800"
		: "bg-yellow-100 text-yellow-900";
}

export function MatchesTable({
	matches,
	onEditMatch,
	onPostponeMatch,
	onRestoreMatch,
}: MatchesTableProps) {
	return (
		<div className="overflow-hidden rounded-xl bg-white shadow">
			{matches.length === 0 ? (
				<div className="p-6">
					<EmptyState
						title="No matches found"
						message="There are no fixtures matching this view yet. Add a match or change your filter."
					/>
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full min-w-[900px] text-sm">
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
										<span
											className={`rounded-full px-2 py-1 text-xs font-semibold ${getTeamBadgeClass(
												match.team
											)}`}
										>
											{getTeamLabel(match.team)}
										</span>
									</td>

									<td className="p-3 font-medium">{match.opponent}</td>

									<td className="p-3 capitalize">{match.venue}</td>

									<td className="p-3">
										{match.result
											? `${match.result.homeGoals} - ${match.result.awayGoals}`
											: "-"}
									</td>

									<td className="p-3">
										<span
											className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${
												match.state === "won"
													? "bg-green-100 text-green-800"
													: match.state === "lost"
														? "bg-red-100 text-red-800"
														: match.state === "draw"
															? "bg-slate-100 text-slate-700"
															: match.state === "postponed"
																? "bg-amber-100 text-amber-800"
																: "bg-blue-100 text-blue-800"
											}`}
										>
											{match.state}
										</span>
									</td>

									<td className="p-3">
										<span
											className={`rounded-full px-2 py-1 text-xs font-semibold ${
												match.isLineupLocked
													? "bg-blue-100 text-blue-800"
													: "bg-slate-100 text-slate-600"
											}`}
										>
											{match.isLineupLocked ? "Saved" : "Not saved"}
										</span>
									</td>

									<td className="p-3">
										<div className="flex flex-wrap justify-end gap-2">
											{!match.isCompleted && (
												<>
													<button
														type="button"
														onClick={() => onEditMatch(match)}
														className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-100"
													>
														Edit
													</button>

													{match.state === "postponed" ? (
														<button
															type="button"
															onClick={() => onRestoreMatch(match.id)}
															className="rounded-lg border border-green-200 px-3 py-1 text-sm text-green-700 hover:bg-green-50"
														>
															Restore
														</button>
													) : (
														<button
															type="button"
															onClick={() => onPostponeMatch(match)}
															className="rounded-lg border border-amber-200 px-3 py-1 text-sm text-amber-700 hover:bg-amber-50"
														>
															Postpone
														</button>
													)}
												</>
											)}

											<Link
												to={`/matches/${match.id}`}
												className="rounded-lg border px-3 py-1 text-sm font-medium text-blue-900 hover:bg-gray-100"
											>
												View
											</Link>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}