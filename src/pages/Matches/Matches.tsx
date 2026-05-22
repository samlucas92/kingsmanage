import { useMemo, useState } from "react";
import { useMatchStore } from "../../stores/match";
import type { Match } from "../../stores/match";
import { MatchFormModal } from "./components/MatchFormModal";
import { MatchesTable } from "./components/MatchesTable";
import { MatchFilters } from "./components/MatchFilters";
import type { MatchFilter } from "./components/MatchFilters";
import { getMatchFilterFromState } from "./components/MatchFilters";
import { PostponeMatchModal } from "./components/match-detail/PostponeMatchModal";
import { useMatchForm } from "./hooks/useMatchForm";
import { formatDateForInput } from "../../utils/date";

export default function Matches() {
	const matches = useMatchStore((state) => state.matches);
	const addMatch = useMatchStore((state) => state.addMatch);
	const updateMatchFixture = useMatchStore(
		(state) => state.updateMatchFixture
	);
	const postponeMatch = useMatchStore((state) => state.postponeMatch);
	const restoreMatch = useMatchStore((state) => state.restoreMatch);

	const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");
	const [matchToPostpone, setMatchToPostpone] = useState<Match | null>(null);
	const [postponedDate, setPostponedDate] = useState("");

	const matchForm = useMatchForm({
		onCreateMatch: addMatch,
		onUpdateMatch: updateMatchFixture,
	});

	const matchCounts = useMemo(() => {
		const upcoming = matches.filter(
			(match) =>
				getMatchFilterFromState(match.state, match.isCompleted) === "upcoming"
		).length;

		const completed = matches.filter(
			(match) =>
				getMatchFilterFromState(match.state, match.isCompleted) === "completed"
		).length;

		const postponed = matches.filter(
			(match) =>
				getMatchFilterFromState(match.state, match.isCompleted) === "postponed"
		).length;

		return {
			all: matches.length,
			upcoming,
			completed,
			postponed,
		};
	}, [matches]);

	const filteredMatches = useMemo(() => {
		if (matchFilter === "all") {
			return matches;
		}

		return matches.filter(
			(match) =>
				getMatchFilterFromState(match.state, match.isCompleted) === matchFilter
		);
	}, [matches, matchFilter]);

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
		if (!matchToPostpone) {
			return;
		}

		if (!postponedDate) {
			return;
		}

		postponeMatch(matchToPostpone.id, postponedDate);
		closePostponeModal();
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-blue-900">Matches</h1>

					<p className="text-gray-600">
						Manage fixtures, results and matchday squads.
					</p>
				</div>

				<button
					type="button"
					onClick={matchForm.openAddMatchModal}
					className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
				>
					Add Match
				</button>
			</div>

			<MatchFilters
				activeFilter={matchFilter}
				counts={matchCounts}
				onFilterChange={setMatchFilter}
			/>

			<MatchesTable
				matches={sortedMatches}
				onEditMatch={matchForm.openEditMatchModal}
				onPostponeMatch={openPostponeModal}
				onRestoreMatch={restoreMatch}
			/>

			<MatchFormModal
				isOpen={matchForm.isMatchModalOpen}
				isEditing={matchForm.isEditing}
				opponent={matchForm.opponent}
				date={matchForm.date}
				venue={matchForm.venue}
				error={matchForm.formError}
				onClose={matchForm.closeMatchModal}
				onConfirm={matchForm.handleConfirmMatch}
				onOpponentChange={matchForm.updateOpponent}
				onDateChange={matchForm.updateDate}
				onVenueChange={matchForm.updateVenue}
			/>

			<PostponeMatchModal
				isOpen={matchToPostpone !== null}
				newDate={postponedDate}
				onClose={closePostponeModal}
				onConfirm={handleConfirmPostpone}
				onUpdateNewDate={setPostponedDate}
			/>
		</div>
	);
}