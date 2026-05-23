import type {
	MatchPlayerStat,
	MatchPlayerStatField,
	MatchPlayerStatValue,
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
		value: MatchPlayerStatValue
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
				minutes: 0,
				isMOTM: false,
				note: "",
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

	const totalMinutes = visibleStats.reduce(
		(total, stat) => total + stat.minutes,
		0
	);

	const motmCount = visibleStats.filter((stat) => stat.isMOTM).length;

	return (
		<section className="flex max-h-[820px] min-h-0 flex-col overflow-hidden rounded-xl bg-white p-6 shadow">
			<div className="shrink-0">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<h2 className="text-lg font-bold text-blue-900">Player Stats</h2>

						<p className="mt-1 text-xs text-slate-500">
							Record goals, assists, cards, minutes, MOTM and player notes.
						</p>
					</div>

					<span
						className={`rounded-full px-3 py-1 text-xs font-semibold ${
							isCompleted
								? "bg-green-100 text-green-800"
								: "bg-amber-100 text-amber-800"
						}`}
					>
						{isCompleted ? "Report editable" : "Complete result first"}
					</span>
				</div>

				<div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-3">
					<SummaryStat label="Goals" value={totalGoals} />
					<SummaryStat label="Assists" value={totalAssists} />
					<SummaryStat label="Yellow Cards" value={totalYellowCards} />
					<SummaryStat label="Red Cards" value={totalRedCards} />
					<SummaryStat label="Minutes" value={totalMinutes} />
					<SummaryStat label="MOTM" value={motmCount} />
				</div>

				{!isCompleted && (
					<p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
						Enter the match result first, then you can complete the player report.
					</p>
				)}
			</div>

			{orderedPlayers.length === 0 ? (
				<div className="mt-4 shrink-0">
					<EmptyState
						title="No players selected"
						message="Select players in the team picker before adding player stats."
					/>
				</div>
			) : (
				<div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-2">
					<div className="space-y-3 pb-1">
						{orderedPlayers.map((selectedPlayer) => {
							const stat = getPlayerStat(selectedPlayer.playerId);

							return (
								<div
									key={selectedPlayer.playerId}
									className="rounded-xl border border-slate-200 bg-slate-50 p-4"
								>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<div>
											<p className="text-sm font-semibold text-slate-900">
												{getPlayerName(selectedPlayer.playerId)}
											</p>

											<span className="mt-1 inline-flex rounded-full bg-white px-2 py-1 text-xs font-semibold capitalize text-slate-700">
												{selectedPlayer.area}
											</span>
										</div>

										<label className="flex h-10 items-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-slate-700">
											<input
												type="checkbox"
												checked={stat.isMOTM}
												disabled={!isCompleted}
												onChange={(event) =>
													onUpdatePlayerStat(
														selectedPlayer.playerId,
														"isMOTM",
														event.target.checked
													)
												}
											/>
											MOTM
										</label>
									</div>

									<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
										<StatInput
											label="G"
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
											label="A"
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
											label="YC"
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
											label="RC"
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

										<StatInput
											label="Min"
											value={stat.minutes}
											disabled={!isCompleted}
											onChange={(value) =>
												onUpdatePlayerStat(
													selectedPlayer.playerId,
													"minutes",
													value
												)
											}
										/>
									</div>

									<label className="mt-4 block">
										<span className="mb-1 block text-xs font-semibold text-slate-500">
											Player note
										</span>

										<textarea
											value={stat.note}
											disabled={!isCompleted}
											onChange={(event) =>
												onUpdatePlayerStat(
													selectedPlayer.playerId,
													"note",
													event.target.value
												)
											}
											className="min-h-24 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
											placeholder="Optional note about this player's performance..."
										/>
									</label>
								</div>
							);
						})}
					</div>
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
	label,
	value,
	disabled,
	onChange,
}: {
	label: string;
	value: number;
	disabled: boolean;
	onChange: (value: number) => void;
}) {
	function handleChange(rawValue: string) {
		const numericValue = rawValue.replace(/\D/g, "");

		onChange(numericValue === "" ? 0 : Number(numericValue));
	}

	return (
		<label className="block">
			<span className="mb-1 block text-center text-xs font-semibold text-slate-500">
				{label}
			</span>

			<input
				type="text"
				inputMode="numeric"
				pattern="[0-9]*"
				value={String(value)}
				disabled={disabled}
				onChange={(event) => handleChange(event.target.value)}
				className="block h-11 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-center text-base font-semibold leading-normal text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
			/>
		</label>
	);
}