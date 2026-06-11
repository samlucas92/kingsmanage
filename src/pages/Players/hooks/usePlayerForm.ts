import { useState } from "react";
import type { Player } from "../../../stores/players";

export type PlayerFormState = {
	name: string;
	number: string;
	appearances: string;
	positions: string[];
	isActive: boolean;
};

type UsePlayerFormProps = {
	players: Player[];
	onCreatePlayer: (player: Omit<Player, "id">) => Promise<void>;
	onUpdatePlayer: (id: string, player: Omit<Player, "id">) => Promise<void>;
};

const emptyPlayerForm: PlayerFormState = {
	name: "",
	number: "",
	appearances: "0",
	positions: [],
	isActive: true,
};

export function usePlayerForm({
	players,
	onCreatePlayer,
	onUpdatePlayer,
}: UsePlayerFormProps) {
	const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
	const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
	const [playerForm, setPlayerForm] = useState<PlayerFormState>(emptyPlayerForm);
	const [formError, setFormError] = useState("");
	const [isSavingPlayer, setIsSavingPlayer] = useState(false);

	const isEditing = editingPlayerId !== null;

	function openAddPlayerModal() {
		setEditingPlayerId(null);
		setPlayerForm(emptyPlayerForm);
		setFormError("");
		setIsSavingPlayer(false);
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
		setIsSavingPlayer(false);
		setIsPlayerModalOpen(true);
	}

	function closePlayerModal() {
		if (isSavingPlayer) {
			return;
		}

		setIsPlayerModalOpen(false);
		setEditingPlayerId(null);
		setPlayerForm(emptyPlayerForm);
		setFormError("");
		setIsSavingPlayer(false);
	}

	function updatePlayerForm(
		field: keyof PlayerFormState,
		value: string | boolean
	) {
		setPlayerForm((currentForm) => ({
			...currentForm,
			[field]: value,
		}));
	}

	function togglePosition(position: string) {
		setPlayerForm((currentForm) => {
			const isSelected = currentForm.positions.includes(position);

			return {
				...currentForm,
				positions: isSelected
					? currentForm.positions.filter(
							(currentPosition) => currentPosition !== position
						)
					: [...currentForm.positions, position],
			};
		});
	}

	async function handleSavePlayer() {
		if (isSavingPlayer) {
			return;
		}

		const name = playerForm.name.trim();
		const number = Number(playerForm.number);
		const appearances = Number(playerForm.appearances);

		if (!name) {
			setFormError("Player name is required.");
			return;
		}

		if (!Number.isFinite(number) || number <= 0) {
			setFormError("Shirt number must be greater than 0.");
			return;
		}

		if (!Number.isFinite(appearances) || appearances < 0) {
			setFormError("Appearances cannot be less than 0.");
			return;
		}

		if (playerForm.positions.length === 0) {
			setFormError("Select at least one position.");
			return;
		}

		const duplicatePlayer = players.find((player) => {
			const isSamePlayer = editingPlayerId && player.id === editingPlayerId;

			return (
				!isSamePlayer &&
				player.name.trim().toLowerCase() === name.toLowerCase()
			);
		});

		if (duplicatePlayer) {
			setFormError("A player with this name already exists.");
			return;
		}

		const playerToSave: Omit<Player, "id"> = {
			name,
			number,
			appearances,
			positions: playerForm.positions,
			isActive: playerForm.isActive,
		};

		try {
			setIsSavingPlayer(true);
			setFormError("");

			if (editingPlayerId) {
				await onUpdatePlayer(editingPlayerId, playerToSave);
			} else {
				await onCreatePlayer(playerToSave);
			}

			setIsPlayerModalOpen(false);
			setEditingPlayerId(null);
			setPlayerForm(emptyPlayerForm);
			setFormError("");
		} catch (error) {
			setFormError(
				error instanceof Error
					? error.message
					: "Player could not be saved."
			);
		} finally {
			setIsSavingPlayer(false);
		}
	}

	return {
		isPlayerModalOpen,
		isEditing,
		isSavingPlayer,
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