import { Link } from "react-router-dom";
import type { Match, MatchState } from "../../../stores/match";
import { getClubTeamLabel, useClubTeamStore } from "../../../stores/clubTeams";
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
	const profiles = useClubTeamStore((state) => state.profiles);
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
		<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
			<div className="divide-y divide-slate-100 md:hidden">
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
										label={getClubTeamLabel(profiles, match.team)}
										tone="info"
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
	const profiles = useClubTeamStore((state) => state.profiles);
	return (
		<div className="relative flex min-h-[94px] items-center gap-3 px-3 py-3">
			<div className="flex w-12 shrink-0 flex-col items-center border-r border-slate-100 pr-3 text-center">
				<span className="text-[9px] font-black uppercase text-slate-500">
					{new Date(match.date).toLocaleDateString("en-GB", { month: "short" })}
				</span>
				<strong className="text-2xl leading-7 text-slate-950">
					{new Date(match.date).toLocaleDateString("en-GB", { day: "2-digit" })}
				</strong>
				<span className="text-[9px] font-bold text-slate-500">
					{formatDisplayTime(match.date)}
				</span>
			</div>

			<Link to={`/matches/${match.id}`} className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<h2 className="truncate text-sm font-black text-slate-950">
						vs {match.opponent}
					</h2>
					{match.result && (
						<span className="rounded-md bg-yepset-50 px-1.5 py-0.5 text-[10px] font-black text-yepset-800">
							{getResultLabel(match)}
						</span>
					)}
				</div>
				<p className="mt-1 truncate text-[11px] font-semibold text-slate-500">
					{match.venue === "home" ? "Home" : "Away"}
					{match.location ? ` · ${match.location}` : ""}
				</p>
				<p className="mt-1.5 text-[10px] font-bold text-yepset-700">
					{getClubTeamLabel(profiles, match.team)} · {match.isLineupLocked ? "Lineup saved" : "Lineup to pick"}
				</p>
			</Link>

			<Link
				to={`/matches/${match.id}`}
				className="grid h-9 w-7 shrink-0 place-items-center text-xl text-yepset-700"
				aria-label={`View match against ${match.opponent}`}
			>
				›
			</Link>

			<details className="group relative shrink-0">
				<summary className="grid h-9 w-7 cursor-pointer list-none place-items-center text-lg font-black text-slate-500">
					⋮
				</summary>
				<div className="absolute right-0 z-10 mt-1 grid min-w-32 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
					<MatchActions
						match={match}
						onEditMatch={onEditMatch}
						onPostponeMatch={onPostponeMatch}
						onRestoreMatch={onRestoreMatch}
						isMobile
					/>
				</div>
			</details>
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
