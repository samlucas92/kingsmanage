import { useParams } from "react-router-dom";
import LinkButton from "../../components/compositions/LinkButton";
import NotFoundCard from "../../components/compositions/NotFoundCard";
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

	const squadAppearances = matches.filter((match) =>
		match.selectedPlayers.some(
			(selectedPlayer) => selectedPlayer.playerId === currentPlayer.id
		)
	);

	const startedMatches = matches.filter((match) =>
		match.selectedPlayers.some(
			(selectedPlayer) =>
				selectedPlayer.playerId === currentPlayer.id &&
				selectedPlayer.area === "pitch"
		)
	);

	const benchedMatches = matches.filter((match) =>
		match.selectedPlayers.some(
			(selectedPlayer) =>
				selectedPlayer.playerId === currentPlayer.id &&
				selectedPlayer.area === "bench"
		)
	);

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

	const recentMatchStats = playerMatchStats
		.filter(
			(stat) =>
				stat.goals > 0 ||
				stat.assists > 0 ||
				stat.yellowCards > 0 ||
				stat.redCards > 0
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
				<Stat label="Yellow Cards" value={totalYellowCards} />
				<Stat label="Red Cards" value={totalRedCards} />
			</div>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<Stat label="Squad Apps" value={squadAppearances.length} />
				<Stat label="Starts" value={startedMatches.length} />
				<Stat label="Bench" value={benchedMatches.length} />
				<Stat label="Stored Apps" value={currentPlayer.appearances} />
			</div>

			<div className="rounded-xl bg-white p-6 shadow">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h2 className="text-lg font-bold text-blue-900">
							Recent Match Contributions
						</h2>

						<p className="mt-1 text-sm text-gray-500">
							Goals, assists and cards recorded from match reports.
						</p>
					</div>
				</div>

				{recentMatchStats.length === 0 ? (
					<div className="mt-4">
						<EmptyContributions />
					</div>
				) : (
					<div className="mt-4 overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="border-b bg-slate-50">
								<tr className="text-left">
									<th className="p-3">Match</th>
									<th className="p-3">Date</th>
									<th className="p-3 text-center">G</th>
									<th className="p-3 text-center">A</th>
									<th className="p-3 text-center">YC</th>
									<th className="p-3 text-center">RC</th>
								</tr>
							</thead>

							<tbody>
								{recentMatchStats.map((stat) => (
									<tr
										key={`${stat.match.id}-${stat.playerId}`}
										className="border-b last:border-b-0"
									>
										<td className="p-3 font-medium text-slate-900">
											vs {stat.match.opponent}
										</td>

										<td className="p-3 text-slate-500">
											{formatDisplayDate(stat.match.date)}
										</td>

										<td className="p-3 text-center">{stat.goals}</td>
										<td className="p-3 text-center">{stat.assists}</td>
										<td className="p-3 text-center">{stat.yellowCards}</td>
										<td className="p-3 text-center">{stat.redCards}</td>
									</tr>
								))}
							</tbody>
						</table>
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

function EmptyContributions() {
	return (
		<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
			<h3 className="text-sm font-bold text-slate-900">
				No match stats recorded yet
			</h3>

			<p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
				Once goals, assists or cards are added from a match report, they’ll
				show here.
			</p>
		</div>
	);
}

function Stat({ label, value }: { label: string | number; value: string | number }) {
	return (
		<div className="rounded-xl bg-white p-4 shadow">
			<p className="text-sm text-gray-500">{label}</p>
			<p className="text-2xl font-bold text-blue-900">{value}</p>
		</div>
	);
}