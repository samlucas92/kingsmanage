import { Link } from "react-router-dom";
import type { Match, MatchState } from "../../../stores/match";
import { getClubTeamLabel, useClubTeamStore } from "../../../stores/clubTeams";
import { formatDisplayTime } from "../../../utils/date";
import EmptyState from "../../../components/compositions/EmptyState";
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
		<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
			<div className="divide-y divide-slate-100 lg:hidden">
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

			<div className="hidden lg:block">
				<div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 lg:px-6">
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-xs font-black uppercase tracking-[0.16em] text-yepset-700">
								Fixture list
							</p>
							<p className="mt-1 text-sm font-medium text-slate-500">
								Open a match to manage its squad, lineup and matchday workflow.
							</p>
						</div>
						<span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm ring-1 ring-slate-200">
							{matches.length} {matches.length === 1 ? "match" : "matches"}
						</span>
					</div>
				</div>

				<div className="divide-y divide-slate-200">
					{matches.map((match, index) => (
						<DesktopMatchCard
							key={match.id}
							match={match}
							isNextMatch={index === 0 && match.state === "upcoming"}
							onEditMatch={onEditMatch}
							onPostponeMatch={onPostponeMatch}
							onRestoreMatch={onRestoreMatch}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function DesktopMatchCard({
	match,
	isNextMatch,
	onEditMatch,
	onPostponeMatch,
	onRestoreMatch,
}: {
	match: Match;
	isNextMatch: boolean;
	onEditMatch: (match: Match) => void;
	onPostponeMatch: (match: Match) => void;
	onRestoreMatch: (matchId: string) => void;
}) {
	const profiles = useClubTeamStore((state) => state.profiles);
	const matchDate = new Date(match.date);
	const dateLabel = matchDate.toLocaleDateString("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
	}).toUpperCase();
	const locationLabel =
		match.location || (match.venue === "home" ? "Home venue" : "Away venue");

	return (
		<article className="group relative grid min-h-40 grid-cols-[116px_minmax(0,1fr)_auto] overflow-hidden bg-white transition hover:bg-slate-50/70">
			<div
				className={`flex flex-col justify-center border-r px-5 py-6 ${
					isNextMatch
						? "border-yepset-700 bg-yepset-800 text-white"
						: "border-slate-200 bg-slate-50 text-slate-950"
				}`}
			>
				{isNextMatch && (
					<span className="mb-2 text-[9px] font-black uppercase tracking-[0.15em] text-kick-300">
						Next match
					</span>
				)}
				<span
					className={`text-[11px] font-black tracking-wide ${
						isNextMatch ? "text-white/70" : "text-slate-500"
					}`}
				>
					{dateLabel}
				</span>
				<strong className="mt-1 text-2xl font-black leading-none">
					{formatDisplayTime(match.date)}
				</strong>
			</div>

			<Link
				to={`/matches/${match.id}`}
				className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(180px,0.55fr)] items-center gap-6 px-6 py-5"
			>
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
						<span className="text-xs font-black uppercase tracking-[0.12em] text-yepset-700">
							{getClubTeamLabel(profiles, match.team)}
						</span>
						<span className="text-xs font-bold uppercase text-slate-400">
							{match.venue === "home" ? "Home" : "Away"}
						</span>
					</div>
					<h2 className="mt-2 break-words text-xl font-black leading-tight text-slate-950 lg:text-2xl">
						<span className="mr-2 text-sm font-black uppercase tracking-wide text-slate-400">vs</span>
						{match.opponent}
					</h2>
					<p className="mt-2 truncate text-sm font-medium text-slate-500">
						{[match.competition, locationLabel].filter(Boolean).join(" · ")}
					</p>
				</div>

				<div className="grid gap-2 border-l border-slate-200 pl-6">
					<div className="flex flex-wrap items-center gap-2">
						<StatusBadge
							label={getStateLabel(match.state)}
							tone={getStateTone(match.state)}
						/>
						<StatusBadge
							label={match.isLineupLocked ? "Lineup saved" : "Lineup to pick"}
							tone={match.isLineupLocked ? "success" : "neutral"}
						/>
					</div>
					<p className="text-sm font-black text-slate-900">
						{match.result ? getResultLabel(match) : "Open match hub"}
						<span className="ml-2 inline-block text-lg text-yepset-700 transition group-hover:translate-x-1">
							→
						</span>
					</p>
				</div>
			</Link>

			<div className="flex w-36 flex-col justify-center gap-2 border-l border-slate-200 px-4 py-5">
				<Link
					to={`/matches/${match.id}`}
					className="rounded-xl bg-yepset-700 px-4 py-2.5 text-center text-sm font-black text-white shadow-sm transition hover:bg-yepset-800"
				>
					Open match
				</Link>
				<details className="group/actions relative">
					<summary className="cursor-pointer list-none rounded-xl border border-slate-200 px-4 py-2 text-center text-xs font-bold text-slate-600 hover:bg-white">
						More actions
					</summary>
					<div className="absolute right-0 z-20 mt-2 grid min-w-36 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
						<MatchActions
							match={match}
							onEditMatch={onEditMatch}
							onPostponeMatch={onPostponeMatch}
							onRestoreMatch={onRestoreMatch}
							isMobile
							hideView
						/>
					</div>
				</details>
			</div>
		</article>
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
	hideView = false,
}: {
	match: Match;
	onEditMatch: (match: Match) => void;
	onPostponeMatch: (match: Match) => void;
	onRestoreMatch: (matchId: string) => void;
	isMobile?: boolean;
	hideView?: boolean;
}) {
	const buttonClassName = isMobile
		? "rounded-lg border px-3 py-2 text-center text-sm font-medium hover:bg-gray-100"
		: "rounded-lg border px-3 py-1 text-sm hover:bg-gray-100";

	const viewClassName = isMobile
		? "rounded-lg border px-3 py-2 text-center text-sm font-medium text-blue-900 hover:bg-gray-100"
		: "rounded-lg border px-3 py-1 text-sm font-medium text-blue-900 hover:bg-gray-100";

	return (
		<>
			<button
				type="button"
				onClick={() => onEditMatch(match)}
				className={buttonClassName}
			>
				Edit
			</button>

			{!match.isCompleted && (
				<>
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

			{!hideView && (
				<Link to={`/matches/${match.id}`} className={viewClassName}>
					View
				</Link>
			)}
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
