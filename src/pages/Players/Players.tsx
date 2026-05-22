import { useMemo, useState } from "react";
import { usePlayerStore } from "../../stores/players";
import type { Player } from "../../stores/players";
import { PlayerFormModal } from "./components/PlayerFormModal";
import { PlayersTable } from "./components/PlayersTable";
import { PlayersFilters } from "./components/PlayerFilter";
import { usePlayerForm } from "./hooks/usePlayerForm";

export default function Players() {
	const players = usePlayerStore((state) => state.players);
	const addPlayer = usePlayerStore((state) => state.addPlayer);
	const updatePlayer = usePlayerStore((state) => state.updatePlayer);
	const togglePlayerActive = usePlayerStore(
		(state) => state.togglePlayerActive
	);

	const [searchTerm, setSearchTerm] = useState("");
	const [positionFilter, setPositionFilter] = useState("all");
	const [includeInactive, setIncludeInactive] = useState(false);

	const playerForm = usePlayerForm({
		players,
		onCreatePlayer: (player) => {
			addPlayer({
				id: crypto.randomUUID(),
				...player,
			});
		},
		onUpdatePlayer: updatePlayer,
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

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-blue-900">Players</h1>

					<p className="text-gray-600">
						Manage squad members and active status.
					</p>
				</div>

				<button
					type="button"
					onClick={playerForm.openAddPlayerModal}
					className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
				>
					Add Player
				</button>
			</div>

			<PlayersFilters
				searchTerm={searchTerm}
				positionFilter={positionFilter}
				includeInactive={includeInactive}
				onSearchTermChange={setSearchTerm}
				onPositionFilterChange={setPositionFilter}
				onIncludeInactiveChange={setIncludeInactive}
			/>

			<PlayersTable
				players={filteredPlayers}
				onEditPlayer={openEditPlayerModal}
				onTogglePlayerActive={togglePlayerActive}
			/>

			<PlayerFormModal
				isOpen={playerForm.isPlayerModalOpen}
				isEditing={playerForm.isEditing}
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