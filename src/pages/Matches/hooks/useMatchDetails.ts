import { useEffect, useMemo, useState } from "react";
import { useMatchStore } from "../../../stores/match";
import type {
	MatchNotes,
	MatchPlayerStat,
} from "../../../stores/match";
import { usePlayerStore } from "../../../stores/players";
import { useEventStore } from "../../../stores/events";
import { useSeasonStore } from "../../../stores/seasons";
import { getPlayerAvailabilityStatus } from "../../../utils/events";
import {
	getTrainingAvailabilitySummary,
	type TrainingAvailabilitySummary,
} from "../../../utils/trainingAvailability";

type ResultPreview = "won" | "lost" | "draw";

const emptyMatchNotes: MatchNotes = {
	availability: "",
	tactical: "",
	injuries: "",
	general: "",
};

export function useMatchDetail(matchId?: string) {
	const players = usePlayerStore((state) => state.players);
	const isLoadingPlayers = usePlayerStore((state) => state.isLoadingPlayers);
	const playerLoadError = usePlayerStore((state) => state.playerLoadError);
	const loadPlayers = usePlayerStore((state) => state.loadPlayers);

	const match = useMatchStore((state) =>
		state.matches.find((match) => match.id === matchId)
	);
	const isLoadingMatches = useMatchStore((state) => state.isLoadingMatches);
	const matchLoadError = useMatchStore((state) => state.matchLoadError);
	const loadMatch = useMatchStore((state) => state.loadMatch);
	const setResult = useMatchStore((state) => state.setResult);
	const postponeMatch = useMatchStore((state) => state.postponeMatch);
	const toggleLineupLocked = useMatchStore(
		(state) => state.toggleLineupLocked
	);
	const updateMatchNotes = useMatchStore((state) => state.updateMatchNotes);
	const updateMatchPlayerStats = useMatchStore(
		(state) => state.updateMatchPlayerStats
	);
	const deleteMatch = useMatchStore((state) => state.deleteMatch);
	const events = useEventStore((state) => state.events);
	const selectedEvent = useEventStore((state) => state.selectedEvent);
	const loadEvents = useEventStore((state) => state.loadEvents);
	const loadEvent = useEventStore((state) => state.loadEvent);
	const seasons = useSeasonStore((state) => state.seasons);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);

	const [showResultModal, setShowResultModal] = useState(false);
	const [homeGoals, setHomeGoals] = useState(0);
	const [awayGoals, setAwayGoals] = useState(0);
	const [showPostponeModal, setShowPostponeModal] = useState(false);
	const [newDate, setNewDate] = useState("");
	const [showIncompleteLineupModal, setShowIncompleteLineupModal] = useState(false);
	const [noteState, setNoteState] = useState({
		matchId: "",
		draft: emptyMatchNotes,
		saved: false,
	});

	useEffect(() => {
		void loadPlayers();
	}, [loadPlayers]);

	useEffect(() => {
		void loadEvents();
		void loadSeasons();
	}, [loadEvents, loadSeasons]);

	useEffect(() => {
		if (!matchId) {
			return;
		}

		void loadMatch(matchId);
	}, [loadMatch, matchId]);

	useEffect(() => {
		const clubEventId = match?.clubEventId;

		if (!clubEventId) {
			return;
		}

		const eventIsLoaded =
			selectedEvent?.id === clubEventId ||
			events.some((event) => event.id === clubEventId);

		if (!eventIsLoaded) {
			void loadEvent(clubEventId);
		}
	}, [events, loadEvent, match?.clubEventId, selectedEvent?.id]);

	function getPlayerName(playerId: string) {
		const player = players.find((player) => player.id === playerId);
		return player?.name ?? "Unknown player";
	}

	const currentMatch = match;
	const noteDraft =
		noteState.matchId === currentMatch?.id
			? noteState.draft
			: {
					availability: currentMatch?.notes?.availability ?? "",
					tactical: currentMatch?.notes?.tactical ?? "",
					injuries: currentMatch?.notes?.injuries ?? "",
					general: currentMatch?.notes?.general ?? "",
				};
	const notesSaved =
		noteState.matchId === currentMatch?.id && noteState.saved;
	const starterCount =
		currentMatch?.selectedPlayers.filter(
			(selectedPlayer) => selectedPlayer.area === "pitch"
		).length ?? 0;
	const benchCount =
		currentMatch?.selectedPlayers.filter(
			(selectedPlayer) => selectedPlayer.area === "bench"
		).length ?? 0;
	const totalSelectedCount = currentMatch?.selectedPlayers.length ?? 0;
	const homeTeamName =
		currentMatch?.venue === "home"
			? "Kingsbridge Colts"
			: currentMatch?.opponent ?? "";
	const awayTeamName =
		currentMatch?.venue === "home"
			? currentMatch?.opponent ?? ""
			: "Kingsbridge Colts";
	const resultPreview: ResultPreview =
		homeGoals === awayGoals
			? "draw"
			: currentMatch?.venue === "home"
				? homeGoals > awayGoals
					? "won"
					: "lost"
				: awayGoals > homeGoals
					? "won"
					: "lost";
	const linkedEvent = currentMatch?.clubEventId
		? selectedEvent?.id === currentMatch.clubEventId
			? selectedEvent
			: events.find((event) => event.id === currentMatch.clubEventId)
		: undefined;
	const matchSeason = useMemo(
		() =>
			currentMatch?.seasonId
				? seasons.find((season) => season.id === currentMatch.seasonId)
				: undefined,
		[currentMatch?.seasonId, seasons]
	);

	function getMatchPlayerAvailabilityStatus(playerId: string) {
		return linkedEvent
			? getPlayerAvailabilityStatus(linkedEvent, playerId)
			: undefined;
	}

	function getPlayerTrainingAvailability(
		playerId: string
	): TrainingAvailabilitySummary {
		return getTrainingAvailabilitySummary({
			playerId,
			events,
			seasonStartDate: matchSeason?.startDate,
			seasonEndDate: matchSeason?.endDate,
			untilDate: currentMatch?.date,
		});
	}

	function handleSaveTeamClick() {
		if (!currentMatch) {
			return;
		}

		if (currentMatch.isLineupLocked) {
			void toggleLineupLocked(currentMatch.id);
			return;
		}

		if (starterCount < 11) {
			setShowIncompleteLineupModal(true);
			return;
		}

		void toggleLineupLocked(currentMatch.id);
	}

	function handleConfirmIncompleteLineup() {
		if (!currentMatch) {
			return;
		}

		void toggleLineupLocked(currentMatch.id);
		setShowIncompleteLineupModal(false);
	}

	function handleOpenResultModal() {
		if (!currentMatch) {
			return;
		}

		setHomeGoals(currentMatch.result?.homeGoals ?? 0);
		setAwayGoals(currentMatch.result?.awayGoals ?? 0);
		setShowResultModal(true);
	}

	function handleConfirmResult() {
		if (!currentMatch) {
			return;
		}

		void setResult(currentMatch.id, {
			homeGoals,
			awayGoals,
		});
		setShowResultModal(false);
	}

	function handleConfirmPostpone() {
		if (!currentMatch) {
			return;
		}

		void postponeMatch(currentMatch.id, newDate);
		setShowPostponeModal(false);
		setNewDate("");
	}

	function updateHomeGoals(value: string) {
		setHomeGoals(Math.max(0, Number(value)));
	}

	function updateAwayGoals(value: string) {
		setAwayGoals(Math.max(0, Number(value)));
	}

	function updateNoteDraft(field: keyof MatchNotes, value: string) {
		setNoteState({
			matchId: currentMatch?.id ?? "",
			draft: {
				...noteDraft,
				[field]: value,
			},
			saved: false,
		});
	}

	function handleSaveNotes() {
		if (!currentMatch) {
			return;
		}

		void updateMatchNotes(currentMatch.id, noteDraft);
		setNoteState({
			matchId: currentMatch.id,
			draft: noteDraft,
			saved: true,
		});
	}

	async function handleSaveMatchPlayerStats(playerStats: MatchPlayerStat[]) {
		if (!currentMatch) {
			return;
		}

		await updateMatchPlayerStats(currentMatch.id, playerStats);
	}

	return {
		match: currentMatch,
		isLoadingMatches,
		matchLoadError,
		isLoadingPlayers,
		playerLoadError,
		showResultModal,
		homeGoals,
		awayGoals,
		showPostponeModal,
		newDate,
		showIncompleteLineupModal,
		noteDraft,
		notesSaved,
		starterCount,
		benchCount,
		totalSelectedCount,
		homeTeamName,
		awayTeamName,
		resultPreview,
		setShowResultModal,
		setShowPostponeModal,
		setShowIncompleteLineupModal,
		setNewDate,
		handleSaveTeamClick,
		handleConfirmIncompleteLineup,
		handleOpenResultModal,
		handleConfirmResult,
		handleConfirmPostpone,
		updateHomeGoals,
		updateAwayGoals,
		updateNoteDraft,
		handleSaveNotes,
		getPlayerName,
		getMatchPlayerAvailabilityStatus,
		getPlayerTrainingAvailability,
		handleSaveMatchPlayerStats,
		deleteMatch,
	};
}
