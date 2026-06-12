import { useEffect, useMemo, useState } from "react";
import { usePlayerStore } from "../../stores/players";
import type { Player } from "../../stores/players";
import { PlayerFormModal } from "./components/PlayerFormModal";
import { PlayersTable } from "./components/PlayersTable";
import { PlayersFilters } from "./components/PlayerFilter";
import { usePlayerForm } from "./hooks/usePlayerForm";

export default function Players() {
	const players = usePlayerStore((state) => state.players);
	const isLoadingPlayers = usePlayerStore((state) => state.isLoadingPlayers);
	const hasLoadedPlayers = usePlayerStore((state) => state.hasLoadedPlayers);
	const playerLoadError = usePlayerStore((state) => state.playerLoadError);
	const loadPlayers = usePlayerStore((state) => state.loadPlayers);
	const addPlayer = usePlayerStore((state) => state.addPlayer);
	const updatePlayer = usePlayerStore((state) => state.updatePlayer);
	const togglePlayerActive = usePlayerStore(
		(state) => state.togglePlayerActive
	);

	const [searchTerm, setSearchTerm] = useState("");
	const [positionFilter, setPositionFilter] = useState("all");
	const [includeInactive, setIncludeInactive] = useState(false);
	const [actionError, setActionError] = useState("");
	const [activeTogglePlayerId, setActiveTogglePlayerId] = useState<string | null>(null);

	useEffect(() => {
		void loadPlayers(true);
	}, [loadPlayers]);

	const playerForm = usePlayerForm({
		players,
		onCreatePlayer: async (player) => {
			setActionError("");
			await addPlayer(player);
		},
		onUpdatePlayer: async (id, player) => {
			setActionError("");
			await updatePlayer(id, player);
		},
	});

	const filteredPlayers = useMemo(() => {
		return players.filter((player) => {
			const matchesSearch = player.name
				.toLowerCase()
				.includes(searchTerm.toLowerCase());
			const matchesPosition =
				positionFilter === "all" || player.positions.includes(positionFilter);
			const matchesActive = includeInactive || player.isActive;

			return matchesSearch && matchesPosition && matchesActive;
		});
	}, [players, searchTerm, positionFilter, includeInactive]);

	function openEditPlayerModal(player: Player) {
		playerForm.openEditPlayerModal(player);
	}

	async function handleTogglePlayerActive(playerId: string) {
		if (activeTogglePlayerId) {
			return;
		}

		try {
			setActionError("");
			setActiveTogglePlayerId(playerId);
			await togglePlayerActive(playerId);
		} catch (error) {
			setActionError(
				error instanceof Error
					? error.message
					: "Could not update player active status."
			);
		} finally {
			setActiveTogglePlayerId(null);
		}
	}

	const isInitialLoading = isLoadingPlayers && !hasLoadedPlayers && players.length === 0;
	const hasNoPlayers = hasLoadedPlayers && players.length === 0;
	const hasNoFilteredPlayers =
		hasLoadedPlayers && players.length > 0 && filteredPlayers.length === 0;

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Players</h1>
					<p className="text-sm text-slate-500">
						Manage squad members and active status.
					</p>
				</div>

				<button
					type="button"
					onClick={playerForm.openAddPlayerModal}
					disabled={isInitialLoading}
					className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
				>
					Add Player
				</button>
			</div>

			{playerLoadError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<span>{playerLoadError}</span>
						<button
							type="button"
							onClick={() => void loadPlayers(true)}
							className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
						>
							Retry
						</button>
					</div>
				</div>
			)}

			{actionError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					{actionError}
				</div>
			)}

			{isInitialLoading && (
				<div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
					Loading players...
				</div>
			)}

			{activeTogglePlayerId && (
				<div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
					Updating player status...
				</div>
			)}

			<PlayersFilters
				searchTerm={searchTerm}
				positionFilter={positionFilter}
				includeInactive={includeInactive}
				onSearchTermChange={setSearchTerm}
				onPositionFilterChange={setPositionFilter}
				onIncludeInactiveChange={setIncludeInactive}
			/>

			{hasNoPlayers ? (
				<div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
					No players have been added yet. Add your first player to start building the squad.
				</div>
			) : hasNoFilteredPlayers ? (
				<div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
					No players match those filters.
				</div>
			) : (
				<PlayersTable
					players={filteredPlayers}
					onEditPlayer={openEditPlayerModal}
					onTogglePlayerActive={(playerId) => void handleTogglePlayerActive(playerId)}
				/>
			)}

			<PlayerFormModal
				isOpen={playerForm.isPlayerModalOpen}
				isEditing={playerForm.isEditing}
				isSaving={playerForm.isSavingPlayer}
				playerForm={playerForm.playerForm}
				formError={playerForm.formError}
				onClose={playerForm.closePlayerModal}
				onConfirm={playerForm.handleSavePlayer}
				onUpdatePlayerForm={playerForm.updatePlayerForm}
				onTogglePosition={playerForm.togglePosition}
			/>
		</div>
	);
}
