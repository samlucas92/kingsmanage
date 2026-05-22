import { useState } from "react";
import type { Match, MatchFixtureInput } from "../../../stores/match";
import { formatDateForInput } from "../../../utils/date";

type UseMatchFormParams = {
	onCreateMatch: (match: MatchFixtureInput) => void;
	onUpdateMatch: (matchId: string, match: MatchFixtureInput) => void;
};

export function useMatchForm({
	onCreateMatch,
	onUpdateMatch,
}: UseMatchFormParams) {
	const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
	const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
	const [opponent, setOpponent] = useState("");
	const [date, setDate] = useState("");
	const [venue, setVenue] = useState<"home" | "away">("home");
	const [formError, setFormError] = useState("");

	const isEditing = editingMatchId !== null;

	function openAddMatchModal() {
		setEditingMatchId(null);
		setOpponent("");
		setDate("");
		setVenue("home");
		setFormError("");
		setIsMatchModalOpen(true);
	}

	function openEditMatchModal(match: Match) {
		if (match.isCompleted) {
			return;
		}

		setEditingMatchId(match.id);
		setOpponent(match.opponent);
		setDate(formatDateForInput(match.date));
		setVenue(match.venue);
		setFormError("");
		setIsMatchModalOpen(true);
	}

	function closeMatchModal() {
		setIsMatchModalOpen(false);
		setEditingMatchId(null);
		setOpponent("");
		setDate("");
		setVenue("home");
		setFormError("");
	}

	function updateOpponent(value: string) {
		setOpponent(value);
		setFormError("");
	}

	function updateDate(value: string) {
		setDate(value);
		setFormError("");
	}

	function updateVenue(value: "home" | "away") {
		setVenue(value);
		setFormError("");
	}

	function validateMatchForm() {
		if (!opponent.trim()) {
			return "Opponent is required.";
		}

		if (!date) {
			return "Date and time are required.";
		}

		return "";
	}

	function handleConfirmMatch() {
		const validationError = validateMatchForm();

		if (validationError) {
			setFormError(validationError);
			return;
		}

		const savedMatch = {
			opponent: opponent.trim(),
			date,
			venue,
		};

		if (editingMatchId) {
			onUpdateMatch(editingMatchId, savedMatch);
		} else {
			onCreateMatch(savedMatch);
		}

		closeMatchModal();
	}

	return {
		isMatchModalOpen,
		isEditing,
		opponent,
		date,
		venue,
		formError,
		openAddMatchModal,
		openEditMatchModal,
		closeMatchModal,
		updateOpponent,
		updateDate,
		updateVenue,
		handleConfirmMatch,
	};
}