import { useState } from "react";
import type { ClubTeam, Match, MatchFixtureInput } from "../../../stores/match";
import { FIRST_TEAM_ID } from "../../../stores/clubTeams";
import { formatDateForInput } from "../../../utils/date";

type UseMatchFormParams = {
	onCreateMatch: (match: MatchFixtureInput) => Promise<void> | void;
	onUpdateMatch: (
		matchId: string,
		match: MatchFixtureInput
	) => Promise<void> | void;
};

export function useMatchForm({
	onCreateMatch,
	onUpdateMatch,
}: UseMatchFormParams) {
	const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
	const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
	const [team, setTeam] = useState<ClubTeam>(FIRST_TEAM_ID);
	const [opponent, setOpponent] = useState("");
	const [date, setDate] = useState("");
	const [venue, setVenue] = useState<"home" | "away">("home");
	const [formError, setFormError] = useState("");
	const [isSavingMatch, setIsSavingMatch] = useState(false);

	const isEditing = editingMatchId !== null;

	function resetForm() {
		setEditingMatchId(null);
		setTeam(FIRST_TEAM_ID);
		setOpponent("");
		setDate("");
		setVenue("home");
		setFormError("");
		setIsSavingMatch(false);
	}

	function openAddMatchModal() {
		resetForm();
		setIsMatchModalOpen(true);
	}

	function openEditMatchModal(match: Match) {
		if (match.isCompleted) {
			return;
		}

		setEditingMatchId(match.id);
		setTeam(match.team);
		setOpponent(match.opponent);
		setDate(formatDateForInput(match.date));
		setVenue(match.venue);
		setFormError("");
		setIsSavingMatch(false);
		setIsMatchModalOpen(true);
	}

	function closeMatchModal() {
		if (isSavingMatch) {
			return;
		}

		setIsMatchModalOpen(false);
		resetForm();
	}

	function updateTeam(value: ClubTeam) {
		setTeam(value);
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

	async function handleConfirmMatch() {
		if (isSavingMatch) {
			return;
		}

		const validationError = validateMatchForm();

		if (validationError) {
			setFormError(validationError);
			return;
		}

		const savedMatch: MatchFixtureInput = {
			team,
			opponent: opponent.trim(),
			date,
			venue,
		};

		try {
			setIsSavingMatch(true);
			setFormError("");

			if (editingMatchId) {
				await onUpdateMatch(editingMatchId, savedMatch);
			} else {
				await onCreateMatch(savedMatch);
			}

			setIsMatchModalOpen(false);
			resetForm();
		} catch (error) {
			setFormError(
				error instanceof Error
					? error.message
					: "Match could not be saved."
			);
		} finally {
			setIsSavingMatch(false);
		}
	}

	return {
		isMatchModalOpen,
		isEditing,
		isSavingMatch,
		team,
		opponent,
		date,
		venue,
		formError,
		openAddMatchModal,
		openEditMatchModal,
		closeMatchModal,
		updateTeam,
		updateOpponent,
		updateDate,
		updateVenue,
		handleConfirmMatch,
	};
}
