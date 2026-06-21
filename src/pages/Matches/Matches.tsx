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
	const loadedSeasonId = useMatchStore((state) => state.loadedSeasonId);
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

	const [selectedSeasonId, setSelectedSeasonId] = useState("");
	const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");
	const [teamFilter, setTeamFilter] = useState<MatchTeamFilter>("all");
	const [matchToPostpone, setMatchToPostpone] = useState<Match | null>(null);
	const [postponedDate, setPostponedDate] = useState("");
	const [actionError, setActionError] = useState("");
	const [isSavingMatchAction, setIsSavingMatchAction] = useState(false);

	useEffect(() => {
		void loadSeasons();
	}, [loadSeasons]);

	useEffect(() => {
		if (selectedSeasonId && seasons.some((season) => season.id === selectedSeasonId)) {
			return;
		}

		setSelectedSeasonId(activeSeasonId || seasons[0]?.id || "");
	}, [activeSeasonId, seasons, selectedSeasonId]);

	useEffect(() => {
		if (!selectedSeasonId) {
			return;
		}

		void loadMatches(selectedSeasonId);
	}, [selectedSeasonId, loadMatches]);

	const selectedSeason = seasons.find((season) => season.id === selectedSeasonId);

	async function handleCreateMatch(match: MatchFixtureInput) {
		try {
			setActionError("");
			await addMatch({
				...match,
				seasonId: selectedSeasonId,
			});
		} catch (error) {
			setActionError(
				error instanceof Error ? error.message : "Could not create match."
			);
			throw error;
		}
	}

	async function handleUpdateMatch(matchId: string, match: MatchFixtureInput) {
		try {
			setActionError("");
			await updateMatchFixture(matchId, {
				...match,
				seasonId: selectedSeasonId,
			});
		} catch (error) {
			setActionError(
				error instanceof Error ? error.message : "Could not update match."
			);
			throw error;
		}
	}

	const matchForm = useMatchForm({
		onCreateMatch: handleCreateMatch,
		onUpdateMatch: handleUpdateMatch,
	});

	const selectedSeasonMatches = useMemo(() => {
		if (!selectedSeasonId) {
			return [];
		}

		return matches.filter((match) => match.seasonId === selectedSeasonId);
	}, [matches, selectedSeasonId]);

	const matchCounts = useMemo(() => {
		const visibleTeamMatches = selectedSeasonMatches.filter(
			(match) => teamFilter === "all" || match.team === teamFilter
		);
		const upcoming = visibleTeamMatches.filter(
			(match) =>
				getMatchFilterFromState(match.state, match.isCompleted) === "upcoming"
		).length;
		const completed = visibleTeamMatches.filter(
			(match) =>
				getMatchFilterFromState(match.state, match.isCompleted) === "completed"
		).length;
		const postponed = visibleTeamMatches.filter(
			(match) =>
				getMatchFilterFromState(match.state, match.isCompleted) === "postponed"
		).length;

		return {
			all: visibleTeamMatches.length,
			upcoming,
			completed,
			postponed,
		};
	}, [selectedSeasonMatches, teamFilter]);

	const teamCounts = useMemo(() => {
		const visibleStatusMatches = selectedSeasonMatches.filter((match) => {
			if (matchFilter === "all") {
				return true;
			}

			return (
				getMatchFilterFromState(match.state, match.isCompleted) === matchFilter
			);
		});

		return visibleStatusMatches.reduce<Record<string, number>>(
			(counts, match) => ({
				...counts,
				[match.team]: (counts[match.team] ?? 0) + 1,
			}),
			{ all: visibleStatusMatches.length }
		);
	}, [selectedSeasonMatches, matchFilter]);

	const filteredMatches = useMemo(() => {
		return selectedSeasonMatches.filter((match) => {
			const statusMatches =
				matchFilter === "all" ||
				getMatchFilterFromState(match.state, match.isCompleted) === matchFilter;
			const teamMatches = teamFilter === "all" || match.team === teamFilter;

			return statusMatches && teamMatches;
		});
	}, [selectedSeasonMatches, matchFilter, teamFilter]);

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

	async function handleConfirmPostpone() {
		if (!matchToPostpone || !postponedDate || isSavingMatchAction) {
			return;
		}

		try {
			setIsSavingMatchAction(true);
			setActionError("");
			await postponeMatch(matchToPostpone.id, postponedDate);
			closePostponeModal();
		} catch (error) {
			setActionError(
				error instanceof Error ? error.message : "Could not postpone match."
			);
		} finally {
			setIsSavingMatchAction(false);
		}
	}

	async function handleRestoreMatch(matchId: string) {
		if (isSavingMatchAction) {
			return;
		}

		try {
			setIsSavingMatchAction(true);
			setActionError("");
			await restoreMatch(matchId);
		} catch (error) {
			setActionError(
				error instanceof Error ? error.message : "Could not restore match."
			);
		} finally {
			setIsSavingMatchAction(false);
		}
	}

	const isLoadingInitialData =
		(isLoadingSeasons && seasons.length === 0) ||
		(Boolean(selectedSeasonId) &&
			isLoadingMatches &&
			loadedSeasonId !== selectedSeasonId &&
			selectedSeasonMatches.length === 0);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Matches</h1>
					<p className="mt-1 text-sm text-slate-600">
						Manage fixtures, results and matchday squads.
					</p>
				</div>

				<button
					type="button"
					onClick={matchForm.openAddMatchModal}
					disabled={!selectedSeasonId}
					className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
				>
					Add Match
				</button>
			</div>

			<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
							Season filter
						</p>
						<h2 className="mt-1 text-lg font-bold text-slate-900">
							{selectedSeason?.name ?? "No season selected"}
						</h2>
						<p className="mt-1 text-sm text-slate-600">
							Changing this only filters the matches page. It does not change the active season.
						</p>
					</div>

					<SeasonSelector
						label="Filter season"
						selectedSeasonId={selectedSeasonId}
						onSeasonChange={setSelectedSeasonId}
					/>
				</div>
			</section>

			{seasonLoadError && (
				<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
					{seasonLoadError}
				</div>
			)}

			{matchLoadError && (
				<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<span>{matchLoadError}</span>
						{selectedSeasonId && (
							<button
								type="button"
								onClick={() => void loadMatches(selectedSeasonId, true)}
								className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
							>
								Retry
							</button>
						)}
					</div>
				</div>
			)}

			{actionError && (
				<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
					{actionError}
				</div>
			)}

			{isSavingMatchAction && (
				<div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-600 shadow-sm">
					Saving match changes...
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

			{isLoadingInitialData ? (
				<div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-medium text-slate-600 shadow-sm">
					Loading matches...
				</div>
			) : !selectedSeasonId ? (
				<div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
					Select or create a season before managing matches.
				</div>
			) : sortedMatches.length === 0 ? (
				<div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
					No matches found for the selected season and filters.
				</div>
			) : (
				<MatchesTable
					matches={sortedMatches}
					onEditMatch={matchForm.openEditMatchModal}
					onPostponeMatch={openPostponeModal}
					onRestoreMatch={handleRestoreMatch}
				/>
			)}

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
