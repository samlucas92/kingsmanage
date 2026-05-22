import type {
	MatchPlayerStat,
	MatchPlayerStatField,
	SelectedPlayer,
} from "../../../../stores/match";
import EmptyState from "../../../../components/compositions/EmptyState";

interface MatchStatsCardProps {
	selectedPlayers: SelectedPlayer[];
	playerStats: MatchPlayerStat[];
	isCompleted: boolean;
	getPlayerName: (playerId: string) => string;
	onUpdatePlayerStat: (
		playerId: string,
		field: MatchPlayerStatField,
		value: string
	) => void;
}

export function MatchStatsCard({
	selectedPlayers,
	playerStats,
	isCompleted,
	getPlayerName,
	onUpdatePlayerStat,
}: MatchStatsCardProps) {
	function getPlayerStat(playerId: string) {
		return (
			playerStats.find((stat) => stat.playerId === playerId) ?? {
				playerId,
				goals: 0,
				assists: 0,
				yellowCards: 0,
				redCards: 0,
			}
		);
	}

	const orderedPlayers = [...selectedPlayers].sort((firstPlayer, secondPlayer) => {
		if (firstPlayer.area === secondPlayer.area) {
			return getPlayerName(firstPlayer.playerId).localeCompare(
				getPlayerName(secondPlayer.playerId)
			);
		}

		return firstPlayer.area === "pitch" ? -1 : 1;
	});

	const selectedPlayerIds = new Set(
		selectedPlayers.map((selectedPlayer) => selectedPlayer.playerId)
	);

	const visibleStats = playerStats.filter((stat) =>
		selectedPlayerIds.has(stat.playerId)
	);

	const totalGoals = visibleStats.reduce(
		(total, stat) => total + stat.goals,
		0
	);

	const totalAssists = visibleStats.reduce(
		(total, stat) => total + stat.assists,
		0
	);

	const totalYellowCards = visibleStats.reduce(
		(total, stat) => total + stat.yellowCards,
		0
	);

	const totalRedCards = visibleStats.reduce(
		(total, stat) => total + stat.redCards,
		0
	);

	return (
		<section className="rounded-xl bg-white p-6 shadow">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="text-lg font-bold text-blue-900">Player Stats</h2>

					<p className="mt-1 text-xs text-slate-500">
						Record goals, assists and cards for the selected squad.
					</p>
				</div>

				<span
					className={`rounded-full px-3 py-1 text-xs font-semibold ${
						isCompleted
							? "bg-green-100 text-green-800"
							: "bg-amber-100 text-amber-800"
					}`}
				>
					{isCompleted ? "Stats editable" : "Complete result first"}
				</span>
			</div>

			<div className="mt-4 grid grid-cols-2 gap-3">
				<SummaryStat label="Goals" value={totalGoals} />
				<SummaryStat label="Assists" value={totalAssists} />
				<SummaryStat label="Yellow Cards" value={totalYellowCards} />
				<SummaryStat label="Red Cards" value={totalRedCards} />
			</div>

			{!isCompleted && (
				<p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
					Enter the match result first, then you can record player stats.
				</p>
			)}

			{orderedPlayers.length === 0 ? (
				<div className="mt-4">
					<EmptyState
						title="No players selected"
						message="Select players in the team picker before adding player stats."
					/>
				</div>
			) : (
				<div className="mt-4 overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="border-b bg-slate-50">
							<tr className="text-left">
								<th className="p-2">Player</th>
								<th className="p-2">Area</th>
								<th className="p-2 text-center">G</th>
								<th className="p-2 text-center">A</th>
								<th className="p-2 text-center">YC</th>
								<th className="p-2 text-center">RC</th>
							</tr>
						</thead>

						<tbody>
							{orderedPlayers.map((selectedPlayer) => {
								const stat = getPlayerStat(selectedPlayer.playerId);

								return (
									<tr
										key={selectedPlayer.playerId}
										className="border-b last:border-b-0"
									>
										<td className="p-2 font-medium text-slate-900">
											{getPlayerName(selectedPlayer.playerId)}
										</td>

										<td className="p-2">
											<span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">
												{selectedPlayer.area}
											</span>
										</td>

										<StatInput
											value={stat.goals}
											disabled={!isCompleted}
											onChange={(value) =>
												onUpdatePlayerStat(
													selectedPlayer.playerId,
													"goals",
													value
												)
											}
										/>

										<StatInput
											value={stat.assists}
											disabled={!isCompleted}
											onChange={(value) =>
												onUpdatePlayerStat(
													selectedPlayer.playerId,
													"assists",
													value
												)
											}
										/>

										<StatInput
											value={stat.yellowCards}
											disabled={!isCompleted}
											onChange={(value) =>
												onUpdatePlayerStat(
													selectedPlayer.playerId,
													"yellowCards",
													value
												)
											}
										/>

										<StatInput
											value={stat.redCards}
											disabled={!isCompleted}
											onChange={(value) =>
												onUpdatePlayerStat(
													selectedPlayer.playerId,
													"redCards",
													value
												)
											}
										/>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}

function SummaryStat({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-lg bg-slate-50 p-3">
			<p className="text-xs font-medium text-slate-500">{label}</p>
			<p className="mt-1 text-xl font-bold text-blue-900">{value}</p>
		</div>
	);
}

function StatInput({
	value,
	disabled,
	onChange,
}: {
	value: number;
	disabled: boolean;
	onChange: (value: string) => void;
}) {
	return (
		<td className="p-2 text-center">
			<input
				type="number"
				min={0}
				value={value}
				disabled={disabled}
				onChange={(event) => onChange(event.target.value)}
				className="w-14 rounded-lg border px-2 py-1 text-center disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
			/>
		</td>
	);
}