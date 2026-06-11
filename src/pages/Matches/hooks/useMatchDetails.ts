import { useEffect, useState } from "react";
import { useMatchStore } from "../../../stores/match";
import type {
	MatchNotes,
	MatchPlayerStatField,
	MatchPlayerStatValue,
} from "../../../stores/match";
import { usePlayerStore } from "../../../stores/players";

type ResultPreview = "Won" | "Lost" | "Draw";

const emptyMatchNotes: MatchNotes = {
	availability: "",
	tactical: "",
	injuries: "",
	general: "",
};

export function useMatchDetail(matchId?: string) {
	const players = usePlayerStore((state) => state.players);
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
	const updateMatchPlayerStat = useMatchStore(
		(state) => state.updateMatchPlayerStat
	);

	const [showResultModal, setShowResultModal] = useState(false);
	const [homeGoals, setHomeGoals] = useState(0);
	const [awayGoals, setAwayGoals] = useState(0);
	const [showPostponeModal, setShowPostponeModal] = useState(false);
	const [newDate, setNewDate] = useState("");
	const [showIncompleteLineupModal, setShowIncompleteLineupModal] =
		useState(false);
	const [noteDraft, setNoteDraft] = useState(emptyMatchNotes);
	const [notesSaved, setNotesSaved] = useState(false);

	useEffect(() => {
		void loadPlayers();
	}, [loadPlayers]);

	useEffect(() => {
		if (!matchId) {
			return;
		}

		void loadMatch(matchId);
	}, [loadMatch, matchId]);

	useEffect(() => {
		if (!match) {
			return;
		}

		setNoteDraft({
			availability: match.notes?.availability ?? "",
			tactical: match.notes?.tactical ?? "",
			injuries: match.notes?.injuries ?? "",
			general: match.notes?.general ?? "",
		});
		setNotesSaved(false);
	}, [match?.id]);

	function getPlayerName(playerId: string) {
		const player = players.find((player) => player.id === playerId);

		return player?.name ?? "Unknown player";
	}

	if (!match) {
		return {
			match: undefined,
			isLoadingMatches,
			matchLoadError,
			showResultModal,
			homeGoals,
			awayGoals,
			showPostponeModal,
			newDate,
			showIncompleteLineupModal,
			noteDraft,
			notesSaved,
			starterCount: 0,
			benchCount: 0,
			totalSelectedCount: 0,
			homeTeamName: "",
			awayTeamName: "",
			resultPreview: "Draw" as ResultPreview,
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
			handleUpdateMatchPlayerStat,
		};
	}

	const currentMatch = match;
	const starterCount = currentMatch.selectedPlayers.filter(
		(selectedPlayer) => selectedPlayer.area === "pitch"
	).length;
	const benchCount = currentMatch.selectedPlayers.filter(
		(selectedPlayer) => selectedPlayer.area === "bench"
	).length;
	const totalSelectedCount = currentMatch.selectedPlayers.length;
	const homeTeamName =
		currentMatch.venue === "home" ? "Kingsbridge Colts" : currentMatch.opponent;
	const awayTeamName =
		currentMatch.venue === "home" ? currentMatch.opponent : "Kingsbridge Colts";
	const resultPreview: ResultPreview =
		homeGoals === awayGoals
			? "Draw"
			: currentMatch.venue === "home"
				? homeGoals > awayGoals
					? "Won"
					: "Lost"
				: awayGoals > homeGoals
					? "Won"
					: "Lost";

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
		setNoteDraft((currentNotes) => ({
			...currentNotes,
			[field]: value,
		}));
		setNotesSaved(false);
	}

	function handleSaveNotes() {
		if (!currentMatch) {
			return;
		}

		void updateMatchNotes(currentMatch.id, noteDraft);
		setNotesSaved(true);
	}

	function handleUpdateMatchPlayerStat(
		playerId: string,
		field: MatchPlayerStatField,
		value: MatchPlayerStatValue
	) {
		if (!currentMatch) {
			return;
		}

		const nextValue = typeof value === "number" ? Math.max(0, value) : value;

		void updateMatchPlayerStat(currentMatch.id, playerId, field, nextValue);
	}

	return {
		match: currentMatch,
		isLoadingMatches,
		matchLoadError,
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
		handleUpdateMatchPlayerStat,
	};
}
