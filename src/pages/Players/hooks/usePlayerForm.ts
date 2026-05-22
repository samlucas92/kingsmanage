import { useState } from "react";
import type { Player } from "../../../stores/players";

export type PlayerFormState = {
	name: string;
	number: string;
	appearances: string;
	positions: string[];
	isActive: boolean;
};

export const emptyPlayerForm: PlayerFormState = {
	name: "",
	number: "",
	appearances: "0",
	positions: [],
	isActive: true,
};

type UsePlayerFormParams = {
	players: Player[];
	onCreatePlayer?: (player: Omit<Player, "id">) => void;
	onUpdatePlayer?: (id: string, player: Omit<Player, "id">) => void;
};

export function usePlayerForm({
	players,
	onCreatePlayer,
	onUpdatePlayer,
}: UsePlayerFormParams) {
	const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
	const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
	const [playerForm, setPlayerForm] =
		useState<PlayerFormState>(emptyPlayerForm);
	const [formError, setFormError] = useState("");

	const isEditing = editingPlayerId !== null;

	function openAddPlayerModal() {
		setEditingPlayerId(null);
		setPlayerForm(emptyPlayerForm);
		setFormError("");
		setIsPlayerModalOpen(true);
	}

	function openEditPlayerModal(player: Player) {
		setEditingPlayerId(player.id);
		setPlayerForm({
			name: player.name,
			number: String(player.number),
			appearances: String(player.appearances),
			positions: player.positions,
			isActive: player.isActive,
		});
		setFormError("");
		setIsPlayerModalOpen(true);
	}

	function closePlayerModal() {
		setIsPlayerModalOpen(false);
		setEditingPlayerId(null);
		setPlayerForm(emptyPlayerForm);
		setFormError("");
	}

	function updatePlayerForm(
		field: keyof PlayerFormState,
		value: string | boolean
	) {
		setPlayerForm((currentForm) => ({
			...currentForm,
			[field]: value,
		}));

		setFormError("");
	}

	function togglePosition(position: string) {
		setPlayerForm((currentForm) => {
			const alreadySelected = currentForm.positions.includes(position);

			return {
				...currentForm,
				positions: alreadySelected
					? currentForm.positions.filter(
							(currentPosition) => currentPosition !== position
						)
					: [...currentForm.positions, position],
			};
		});

		setFormError("");
	}

	function validatePlayerForm() {
		const name = playerForm.name.trim();
		const number = Number(playerForm.number);
		const appearances = Number(playerForm.appearances);

		if (!name) {
			return "Player name is required.";
		}

		if (!Number.isInteger(number) || number <= 0) {
			return "Shirt number must be a positive whole number.";
		}

		const shirtNumberAlreadyUsed = players.some(
			(player) => player.number === number && player.id !== editingPlayerId
		);

		if (shirtNumberAlreadyUsed) {
			return `Shirt number ${number} is already being used.`;
		}

		if (!Number.isInteger(appearances) || appearances < 0) {
			return "Appearances must be 0 or above.";
		}

		if (playerForm.positions.length === 0) {
			return "Select at least one position.";
		}

		return "";
	}

	function handleSavePlayer() {
		const validationError = validatePlayerForm();

		if (validationError) {
			setFormError(validationError);
			return;
		}

		const savedPlayer = {
			name: playerForm.name.trim(),
			number: Number(playerForm.number),
			appearances: Number(playerForm.appearances),
			positions: playerForm.positions,
			isActive: playerForm.isActive,
		};

		if (editingPlayerId) {
			onUpdatePlayer?.(editingPlayerId, savedPlayer);
		} else {
			onCreatePlayer?.(savedPlayer);
		}

		closePlayerModal();
	}

	return {
		isPlayerModalOpen,
		isEditing,
		playerForm,
		formError,
		openAddPlayerModal,
		openEditPlayerModal,
		closePlayerModal,
		updatePlayerForm,
		togglePosition,
		handleSavePlayer,
	};
}