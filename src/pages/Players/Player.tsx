import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import LinkButton from "../../components/compositions/LinkButton";
import NotFoundCard from "../../components/compositions/NotFoundCard";
import EmptyState from "../../components/compositions/EmptyState";
import SeasonSelector from "../../components/compositions/SeasonSelector";
import MetricCard from "../../components/compositions/MetricCard";
import StatusBadge from "../../components/compositions/StatusBadge";
import { usePlayerStore } from "../../stores/players";
import { useSeasonStore } from "../../stores/seasons";
import { PlayerFormModal } from "./components/PlayerFormModal";
import { usePlayerForm } from "./hooks/usePlayerForm";
import { formatDisplayDate } from "../../utils/date";
import { matchApi, type PlayerMatchRecord } from "../../services/matchApi";

export default function PlayerProfile() {
	const { id } = useParams();

	const players = usePlayerStore((state) => state.players);
	const isLoadingPlayers = usePlayerStore((state) => state.isLoadingPlayers);
	const playerLoadError = usePlayerStore((state) => state.playerLoadError);
	const loadPlayer = usePlayerStore((state) => state.loadPlayer);
	const addPlayer = usePlayerStore((state) => state.addPlayer);
	const updatePlayer = usePlayerStore((state) => state.updatePlayer);
	const togglePlayerActive = usePlayerStore(
		(state) => state.togglePlayerActive
	);

	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const isLoadingSeasons = useSeasonStore((state) => state.isLoadingSeasons);
	const seasonLoadError = useSeasonStore((state) => state.seasonLoadError);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);

	const [playerMatches, setPlayerMatches] = useState<PlayerMatchRecord[]>([]);
	const [isLoadingPlayerMatches, setIsLoadingPlayerMatches] = useState(false);
	const [playerMatchesError, setPlayerMatchesError] = useState("");

	const player = players.find((player) => player.id === id);
	const activeSeason = seasons.find((season) => season.id === activeSeasonId);

	useEffect(() => {
		if (!id) {
			return;
		}

		void loadPlayer(id);
	}, [id, loadPlayer]);

	useEffect(() => {
		void loadSeasons();
	}, [loadSeasons]);

	useEffect(() => {
		if (!id || !activeSeasonId) {
			setPlayerMatches([]);
			return;
		}

		const playerId = id;
		const seasonId = activeSeasonId;
		let isCurrent = true;

		async function loadPlayerMatches() {
			setIsLoadingPlayerMatches(true);
			setPlayerMatchesError("");

			try {
				const matches = await matchApi.getPlayerMatches(playerId, seasonId);

				if (!isCurrent) {
					return;
				}

				setPlayerMatches(matches);
			} catch (error) {
				if (!isCurrent) {
					return;
				}

				setPlayerMatchesError(
					error instanceof Error
						? error.message
						: "Failed to load player match records."
				);
			} finally {
				if (isCurrent) {
					setIsLoadingPlayerMatches(false);
				}
			}
		}

		void loadPlayerMatches();

		return () => {
			isCurrent = false;
		};
	}, [id, activeSeasonId]);

	const playerForm = usePlayerForm({
		players,
		onCreatePlayer: async (player) => {
			await addPlayer(player);
		},
		onUpdatePlayer: async (playerId, player) => {
			await updatePlayer(playerId, player);
		},
	});

	const selectedSeasonGoals = useMemo(() => {
		return playerMatches.reduce((totalGoals, match) => {
			return totalGoals + (match.playerStat?.goals ?? 0);
		}, 0);
	}, [playerMatches]);

	const recentAppearances = useMemo(() => {
		return [...playerMatches]
			.sort(
				(firstMatch, secondMatch) =>
					new Date(secondMatch.date).getTime() -
					new Date(firstMatch.date).getTime()
			)
			.slice(0, 10);
	}, [playerMatches]);

	if (!id) {
		return (
			<NotFoundCard
				title="Player not found"
				message="That player could not be found."
				action={<LinkButton to="/players">View players</LinkButton>}
			/>
		);
	}

	if (isLoadingPlayers && !player) {
		return (
			<div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
				Loading player...
			</div>
		);
	}

	if (!player) {
		return (
			<NotFoundCard
				title="Player not found"
				message="That player could not be found."
				action={<LinkButton to="/players">View players</LinkButton>}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<LinkButton to="/players">← Back to players</LinkButton>

			{playerLoadError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					{playerLoadError}
				</div>
			)}

			{seasonLoadError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					{seasonLoadError}
				</div>
			)}

			{playerMatchesError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					{playerMatchesError}
				</div>
			)}

			{(isLoadingSeasons || isLoadingPlayerMatches) && (
				<div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
					Loading season data...
				</div>
			)}

			<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
							Player Profile
						</p>
						<h1 className="text-2xl font-bold text-slate-900">
							{player.name}
						</h1>
						<div className="mt-3 flex flex-wrap items-center gap-2">
							<StatusBadge
								label={player.isActive ? "Active" : "Inactive"}
								tone={player.isActive ? "success" : "neutral"}
							/>
							<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
								#{player.number}
							</span>
							{player.positions.map((position) => (
								<span
									key={position}
									className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800"
								>
									{position}
								</span>
							))}
						</div>
					</div>

					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => playerForm.openEditPlayerModal(player)}
							className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
						>
							Edit
						</button>
						<button
							type="button"
							onClick={() => void togglePlayerActive(player.id)}
							className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
						>
							{player.isActive ? "Deactivate" : "Activate"}
						</button>
					</div>
				</div>
			</div>

			<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
							Season view
						</p>
						<h2 className="text-lg font-bold text-slate-900">
							{activeSeason?.name ?? "No season selected"}
						</h2>
					</div>
					<SeasonSelector label="Season" />
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<MetricCard label="Career Apps" value={player.appearances} />
				<MetricCard label="Season Apps" value={playerMatches.length} />
				<MetricCard label="Season Goals" value={selectedSeasonGoals} />
			</div>

			<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
				<h2 className="text-lg font-bold text-slate-900">
					Recent Season Appearances
				</h2>
				<p className="mt-1 text-sm text-slate-500">
					Shows the latest completed selected-season matches where this player was selected.
				</p>

				{recentAppearances.length === 0 ? (
					<div className="mt-4">
						<EmptyState
							title="No appearances yet"
							message="This player has no completed appearances for the selected season."
						/>
					</div>
				) : (
					<div className="mt-4 divide-y divide-slate-100">
						{recentAppearances.map((match) => (
							<div
								key={match.id}
								className="flex items-center justify-between gap-4 py-3 text-sm"
							>
								<div>
									<p className="font-semibold text-slate-900">
										vs {match.opponent}
									</p>
									<p className="text-slate-500">
										{formatDisplayDate(match.date)}
									</p>
								</div>

								<div className="text-right">
									<p className="font-semibold text-slate-900">
										{match.playerStat?.goals ?? 0} goals
									</p>
									{match.playerStat?.isMOTM && (
										<p className="text-xs font-semibold text-amber-700">
											MOTM
										</p>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

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
