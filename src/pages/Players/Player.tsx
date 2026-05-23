import { useParams } from "react-router-dom";
import LinkButton from "../../components/compositions/LinkButton";
import NotFoundCard from "../../components/compositions/NotFoundCard";
import EmptyState from "../../components/compositions/EmptyState";
import { usePlayerStore } from "../../stores/players";
import { useMatchStore } from "../../stores/match";
import { PlayerFormModal } from "./components/PlayerFormModal";
import { usePlayerForm } from "./hooks/usePlayerForm";
import { formatDisplayDate } from "../../utils/date";

export default function PlayerProfile() {
	const { id } = useParams();

	const players = usePlayerStore((state) => state.players);
	const matches = useMatchStore((state) => state.matches);
	const updatePlayer = usePlayerStore((state) => state.updatePlayer);
	const togglePlayerActive = usePlayerStore(
		(state) => state.togglePlayerActive
	);

	const player = players.find((player) => player.id === id);

	const playerForm = usePlayerForm({
		players,
		onUpdatePlayer: updatePlayer,
	});

	if (!player) {
		return (
			<div className="space-y-6">
				<LinkButton to="/players" variant="back" className="mb-4 inline-flex">
					← Back to players
				</LinkButton>

				<NotFoundCard
					title="Player not found"
					message="This player may have been archived, removed, or the link may be incorrect."
					action={
						<LinkButton to="/players" variant="plain">
							View players
						</LinkButton>
					}
				/>
			</div>
		);
	}

	const currentPlayer = player;

	const playerMatchStats = matches.flatMap((match) =>
		(match.playerStats ?? [])
			.filter((stat) => stat.playerId === currentPlayer.id)
			.map((stat) => ({
				...stat,
				match,
			}))
	);

	const calculatedSquadAppearances = matches.filter((match) =>
		match.selectedPlayers.some(
			(selectedPlayer) => selectedPlayer.playerId === currentPlayer.id
		)
	);

	const calculatedStarts = matches.filter((match) =>
		match.selectedPlayers.some(
			(selectedPlayer) =>
				selectedPlayer.playerId === currentPlayer.id &&
				selectedPlayer.area === "pitch"
		)
	);

	const calculatedBenchAppearances = matches.filter((match) =>
		match.selectedPlayers.some(
			(selectedPlayer) =>
				selectedPlayer.playerId === currentPlayer.id &&
				selectedPlayer.area === "bench"
		)
	);

	const manualAppearances = currentPlayer.appearances;
	const calculatedAppearances = calculatedSquadAppearances.length;
	const combinedAppearances = manualAppearances + calculatedAppearances;

	const totalGoals = playerMatchStats.reduce(
		(total, stat) => total + stat.goals,
		0
	);

	const totalAssists = playerMatchStats.reduce(
		(total, stat) => total + stat.assists,
		0
	);

	const totalYellowCards = playerMatchStats.reduce(
		(total, stat) => total + stat.yellowCards,
		0
	);

	const totalRedCards = playerMatchStats.reduce(
		(total, stat) => total + stat.redCards,
		0
	);

	const totalMinutes = playerMatchStats.reduce(
		(total, stat) => total + stat.minutes,
		0
	);

	const motmAwards = playerMatchStats.filter((stat) => stat.isMOTM).length;

	const recentMatchStats = playerMatchStats
		.filter(
			(stat) =>
				stat.goals > 0 ||
				stat.assists > 0 ||
				stat.yellowCards > 0 ||
				stat.redCards > 0 ||
				stat.minutes > 0 ||
				stat.isMOTM ||
				stat.note.trim().length > 0
		)
		.sort(
			(firstStat, secondStat) =>
				new Date(secondStat.match.date).getTime() -
				new Date(firstStat.match.date).getTime()
		)
		.slice(0, 5);

	return (
		<div className="space-y-6">
			<LinkButton to="/players" variant="back" className="mb-4 inline-flex">
				← Back to players
			</LinkButton>

			<div className="rounded-xl bg-white p-6 shadow">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-sm text-gray-500">Player Profile</p>

						<h1 className="text-3xl font-bold text-blue-900">
							{currentPlayer.name}
						</h1>

						<p className="mt-1 text-gray-600">#{currentPlayer.number}</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<span
							className={`rounded-full px-3 py-1 text-xs font-semibold ${
								currentPlayer.isActive
									? "bg-green-100 text-green-700"
									: "bg-gray-200 text-gray-600"
							}`}
						>
							{currentPlayer.isActive ? "Active" : "Inactive"}
						</span>

						<button
							type="button"
							onClick={() => playerForm.openEditPlayerModal(currentPlayer)}
							className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
						>
							Edit
						</button>

						<button
							type="button"
							onClick={() => togglePlayerActive(currentPlayer.id)}
							className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
						>
							{currentPlayer.isActive ? "Deactivate" : "Activate"}
						</button>
					</div>
				</div>

				<div className="mt-4 flex flex-wrap gap-2">
					{currentPlayer.positions.map((position) => (
						<span
							key={position}
							className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800"
						>
							{position}
						</span>
					))}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<Stat label="Goals" value={totalGoals} />
				<Stat label="Assists" value={totalAssists} />
				<Stat label="MOTM" value={motmAwards} />
				<Stat label="Minutes" value={totalMinutes} />
			</div>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<Stat label="Yellow Cards" value={totalYellowCards} />
				<Stat label="Red Cards" value={totalRedCards} />
				<Stat label="Starts" value={calculatedStarts.length} />
				<Stat label="Bench" value={calculatedBenchAppearances.length} />
			</div>

			<div className="rounded-xl bg-white p-6 shadow">
				<div>
					<h2 className="text-lg font-bold text-blue-900">
						Appearances
					</h2>

					<p className="mt-1 text-sm text-gray-500">
						Manual appearances are the stored historic total. Calculated
						appearances come from matchday squads selected in this app.
					</p>
				</div>

				<div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
					<Stat label="Combined Apps" value={combinedAppearances} />
					<Stat label="Manual Apps" value={manualAppearances} />
					<Stat label="Calculated Apps" value={calculatedAppearances} />
					<Stat label="Starts" value={calculatedStarts.length} />
					<Stat label="Bench" value={calculatedBenchAppearances.length} />
				</div>
			</div>

			<div className="rounded-xl bg-white p-6 shadow">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h2 className="text-lg font-bold text-blue-900">
							Recent Match Reports
						</h2>

						<p className="mt-1 text-sm text-gray-500">
							Goals, assists, cards, minutes, MOTM and player notes.
						</p>
					</div>
				</div>

				{recentMatchStats.length === 0 ? (
					<div className="mt-4">
						<EmptyState
							title="No match reports recorded yet"
							message="Once match reports are completed, this player’s contributions will show here."
						/>
					</div>
				) : (
					<div className="mt-4 space-y-3">
						{recentMatchStats.map((stat) => (
							<div
								key={`${stat.match.id}-${stat.playerId}`}
								className="rounded-xl border border-slate-200 bg-slate-50 p-4"
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<p className="font-semibold text-slate-900">
											vs {stat.match.opponent}
										</p>

										<p className="text-sm text-slate-500">
											{formatDisplayDate(stat.match.date)}
										</p>
									</div>

									{stat.isMOTM && (
										<span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
											MOTM
										</span>
									)}
								</div>

								<div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
									<MiniStat label="G" value={stat.goals} />
									<MiniStat label="A" value={stat.assists} />
									<MiniStat label="YC" value={stat.yellowCards} />
									<MiniStat label="RC" value={stat.redCards} />
									<MiniStat label="Min" value={stat.minutes} />
								</div>

								{stat.note && (
									<p className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-600">
										{stat.note}
									</p>
								)}
							</div>
						))}
					</div>
				)}
			</div>

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

function Stat({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="rounded-xl bg-white p-4 shadow">
			<p className="text-sm text-gray-500">{label}</p>
			<p className="text-2xl font-bold text-blue-900">{value}</p>
		</div>
	);
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="rounded-lg bg-white p-2 text-center">
			<p className="text-xs font-semibold text-slate-500">{label}</p>
			<p className="text-sm font-bold text-blue-900">{value}</p>
		</div>
	);
}