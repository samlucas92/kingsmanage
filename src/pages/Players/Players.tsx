import { useEffect, useMemo, useState } from "react";
import { usePlayerStore } from "../../stores/players";
import type { Player } from "../../stores/players";
import { PlayerFormModal } from "./components/PlayerFormModal";
import { PlayersTable } from "./components/PlayersTable";
import { PlayersFilters } from "./components/PlayerFilter";
import { usePlayerForm } from "./hooks/usePlayerForm";
import {
	filterPlayers,
	getPlayersSummary,
	type PlayerStatusFilter,
	type PlayersViewMode,
} from "./playersViewModel";

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
	const [statusFilter, setStatusFilter] = useState<PlayerStatusFilter>("active");
	const [viewMode, setViewMode] = useState<PlayersViewMode>("cards");
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
		return filterPlayers({
			players,
			position: positionFilter,
			searchTerm,
			status: statusFilter,
		});
	}, [players, positionFilter, searchTerm, statusFilter]);
	const summary = useMemo(() => getPlayersSummary(players), [players]);

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
		<div className="space-y-4 lg:space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div className="hidden lg:block">
					<h1 className="text-3xl font-black tracking-tight text-slate-950">Players</h1>
					<p className="mt-1 text-sm text-slate-500">Manage your squad, roles and player availability.</p>
				</div>

				<button
					type="button"
					onClick={playerForm.openAddPlayerModal}
					disabled={isInitialLoading}
					className="ml-auto rounded-xl bg-yepset-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-yepset-800 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300"
				>
					+ Add player
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

			{!isInitialLoading && !hasNoPlayers && <PlayersSummary summary={summary} />}

			<PlayersFilters
				searchTerm={searchTerm}
				positionFilter={positionFilter}
				statusFilter={statusFilter}
				viewMode={viewMode}
				onSearchTermChange={setSearchTerm}
				onPositionFilterChange={setPositionFilter}
				onStatusFilterChange={setStatusFilter}
				onViewModeChange={setViewMode}
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
					viewMode={viewMode}
					activeTogglePlayerId={activeTogglePlayerId}
					onEditPlayer={openEditPlayerModal}
					onTogglePlayerActive={(playerId) => void handleTogglePlayerActive(playerId)}
				/>
			)}

			{!hasNoPlayers && !hasNoFilteredPlayers && (
				<p className="text-sm font-semibold text-slate-500">
					Showing {filteredPlayers.length} of {players.length} {players.length === 1 ? "player" : "players"}
				</p>
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

function PlayersSummary({ summary }: { summary: ReturnType<typeof getPlayersSummary> }) {
	return (
		<section aria-label="Squad summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
			<SummaryCard label="Total players" value={summary.total} icon="players" tone="blue" />
			<SummaryCard label="Active" value={summary.active} icon="active" tone="green" />
			<SummaryCard label="Goalkeepers" value={summary.goalkeepers} icon="goalkeeper" tone="indigo" />
			<SummaryCard label="Inactive" value={summary.inactive} icon="inactive" tone="amber" />
		</section>
	);
}

function SummaryCard({ label, value, icon, tone }: { label: string; value: number; icon: "players" | "active" | "goalkeeper" | "inactive"; tone: "blue" | "green" | "indigo" | "amber" }) {
	const toneClass = {
		blue: "bg-blue-50 text-blue-700",
		green: "bg-emerald-50 text-emerald-700",
		indigo: "bg-indigo-50 text-indigo-700",
		amber: "bg-amber-50 text-amber-700",
	}[tone];

	return (
		<div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
			<span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full sm:h-12 sm:w-12 ${toneClass}`}><SummaryIcon type={icon} /></span>
			<div className="min-w-0"><p className="text-2xl font-black leading-none text-slate-950">{value}</p><p className="mt-1 truncate text-xs font-bold text-slate-500 sm:text-sm">{label}</p></div>
		</div>
	);
}

function SummaryIcon({ type }: { type: "players" | "active" | "goalkeeper" | "inactive" }) {
	if (type === "active") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><circle cx="9" cy="8" r="4" /><path d="M3 21v-2a6 6 0 0 1 9.5-4.9M16 18l2 2 4-5" /></svg>;
	if (type === "goalkeeper") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M5 21V8l7-4 7 4v13" /><path d="M8 21v-7h8v7M9 10h6" /></svg>;
	if (type === "inactive") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></svg>;
	return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><circle cx="9" cy="8" r="4" /><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 5a4 4 0 0 1 0 7M19 15a6 6 0 0 1 3 5v1" /></svg>;
}
