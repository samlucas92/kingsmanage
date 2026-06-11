import { useEffect, useMemo, useState } from "react";
import { useMatchStore } from "../../stores/match";
import { useSeasonStore } from "../../stores/seasons";
import type { Match, MatchFixtureInput } from "../../stores/match";
import SeasonSelector from "../../components/compositions/SeasonSelector";
import { MatchFormModal } from "./components/MatchFormModal";
import { MatchesTable } from "./components/MatchesTable";
import { MatchFilters } from "./components/MatchFilters";
import type { MatchFilter, MatchTeamFilter } from "./components/MatchFilters";
import { getMatchFilterFromState } from "./components/MatchFilters";
import { PostponeMatchModal } from "./components/match-detail/PostponeMatchModal";
import { useMatchForm } from "./hooks/useMatchForm";
import { formatDateForInput } from "../../utils/date";

export default function Matches() {
	const matches = useMatchStore((state) => state.matches);
	const isLoadingMatches = useMatchStore((state) => state.isLoadingMatches);
	const matchLoadError = useMatchStore((state) => state.matchLoadError);
	const loadMatches = useMatchStore((state) => state.loadMatches);
	const addMatch = useMatchStore((state) => state.addMatch);
	const updateMatchFixture = useMatchStore(
		(state) => state.updateMatchFixture
	);
	const postponeMatch = useMatchStore((state) => state.postponeMatch);
	const restoreMatch = useMatchStore((state) => state.restoreMatch);

	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const isLoadingSeasons = useSeasonStore((state) => state.isLoadingSeasons);
	const seasonLoadError = useSeasonStore((state) => state.seasonLoadError);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);

	const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");
	const [teamFilter, setTeamFilter] = useState<MatchTeamFilter>("all");
	const [matchToPostpone, setMatchToPostpone] = useState<Match | null>(null);
	const [postponedDate, setPostponedDate] = useState("");

	useEffect(() => {
		void loadSeasons();
	}, [loadSeasons]);

	useEffect(() => {
		if (!activeSeasonId) {
			return;
		}

		void loadMatches(activeSeasonId);
	}, [activeSeasonId, loadMatches]);

	const activeSeason = seasons.find((season) => season.id === activeSeasonId);

	async function handleCreateMatch(match: MatchFixtureInput) {
		await addMatch({
			...match,
			seasonId: activeSeasonId,
		});
	}

	async function handleUpdateMatch(matchId: string, match: MatchFixtureInput) {
		await updateMatchFixture(matchId, match);
	}

	const matchForm = useMatchForm({
		onCreateMatch: handleCreateMatch,
		onUpdateMatch: handleUpdateMatch,
	});

	const activeSeasonMatches = useMemo(() => {
		if (!activeSeasonId) {
			return [];
		}

		return matches.filter((match) => match.seasonId === activeSeasonId);
	}, [matches, activeSeasonId]);

	const matchCounts = useMemo(() => {
		const visibleTeamMatches = activeSeasonMatches.filter(
			(match) => teamFilter === "all" || match.team === teamFilter
		);
		const upcoming = visibleTeamMatches.filter(
			(match) => getMatchFilterFromState(match.state, match.isCompleted) === "upcoming"
		).length;
		const completed = visibleTeamMatches.filter(
			(match) => getMatchFilterFromState(match.state, match.isCompleted) === "completed"
		).length;
		const postponed = visibleTeamMatches.filter(
			(match) => getMatchFilterFromState(match.state, match.isCompleted) === "postponed"
		).length;

		return {
			all: visibleTeamMatches.length,
			upcoming,
			completed,
			postponed,
		};
	}, [activeSeasonMatches, teamFilter]);

	const teamCounts = useMemo(() => {
		const visibleStatusMatches = activeSeasonMatches.filter((match) => {
			if (matchFilter === "all") {
				return true;
			}

			return (
				getMatchFilterFromState(match.state, match.isCompleted) === matchFilter
			);
		});

		return {
			all: visibleStatusMatches.length,
			first: visibleStatusMatches.filter((match) => match.team === "first").length,
			second: visibleStatusMatches.filter((match) => match.team === "second").length,
		};
	}, [activeSeasonMatches, matchFilter]);

	const filteredMatches = useMemo(() => {
		return activeSeasonMatches.filter((match) => {
			const statusMatches =
				matchFilter === "all" ||
				getMatchFilterFromState(match.state, match.isCompleted) === matchFilter;
			const teamMatches = teamFilter === "all" || match.team === teamFilter;

			return statusMatches && teamMatches;
		});
	}, [activeSeasonMatches, matchFilter, teamFilter]);

	const sortedMatches = useMemo(() => {
		return [...filteredMatches].sort(
			(firstMatch, secondMatch) =>
				new Date(firstMatch.date).getTime() -
				new Date(secondMatch.date).getTime()
		);
	}, [filteredMatches]);

	function openPostponeModal(match: Match) {
		setMatchToPostpone(match);
		setPostponedDate(formatDateForInput(match.date));
	}

	function closePostponeModal() {
		setMatchToPostpone(null);
		setPostponedDate("");
	}

	function handleConfirmPostpone() {
		if (!matchToPostpone || !postponedDate) {
			return;
		}

		void postponeMatch(matchToPostpone.id, postponedDate);
		closePostponeModal();
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Matches</h1>
					<p className="text-sm text-slate-500">
						Manage fixtures, results and matchday squads.
					</p>
				</div>
				<button
					type="button"
					onClick={matchForm.openAddMatchModal}
					disabled={!activeSeasonId}
					className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
				>
					Add Match
				</button>
			</div>

			<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
							Active season
						</p>
						<h2 className="text-lg font-bold text-slate-900">
							{activeSeason?.name ?? "No season selected"}
						</h2>
						<p className="text-sm text-slate-500">
							Matches shown here are loaded for the selected season.
						</p>
					</div>
					<SeasonSelector label="Season" />
				</div>
			</div>

			{seasonLoadError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					{seasonLoadError}
				</div>
			)}

			{matchLoadError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					{matchLoadError}
				</div>
			)}

			{(isLoadingSeasons || isLoadingMatches) && (
				<div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
					Loading matches...
				</div>
			)}

			<MatchFilters
				activeFilter={matchFilter}
				activeTeamFilter={teamFilter}
				counts={matchCounts}
				teamCounts={teamCounts}
				onFilterChange={setMatchFilter}
				onTeamFilterChange={setTeamFilter}
			/>

			<MatchesTable
				matches={sortedMatches}
				onEditMatch={matchForm.openEditMatchModal}
				onPostponeMatch={openPostponeModal}
				onRestoreMatch={(matchId) => void restoreMatch(matchId)}
			/>

			<MatchFormModal
				isOpen={matchForm.isMatchModalOpen}
				isEditing={matchForm.isEditing}
				team={matchForm.team}
				opponent={matchForm.opponent}
				date={matchForm.date}
				venue={matchForm.venue}
				error={matchForm.formError}
				onClose={matchForm.closeMatchModal}
				onConfirm={matchForm.handleConfirmMatch}
				onTeamChange={matchForm.updateTeam}
				onOpponentChange={matchForm.updateOpponent}
				onDateChange={matchForm.updateDate}
				onVenueChange={matchForm.updateVenue}
			/>

			<PostponeMatchModal
				isOpen={Boolean(matchToPostpone)}
				newDate={postponedDate}
				onClose={closePostponeModal}
				onConfirm={handleConfirmPostpone}
				onUpdateNewDate={setPostponedDate}
			/>
		</div>
	);
}
