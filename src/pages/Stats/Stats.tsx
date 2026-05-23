import { useMemo, useState } from "react";
import { usePlayerStore } from "../../stores/players";
import { useMatchStore } from "../../stores/match";
import { useSeasonStore } from "../../stores/seasons";
import { DEFAULT_SEASON_ID } from "../../data/seedSeasons";
import { getPreSeasonPlayerStats } from "../../data/preSeasonPlayerStats";

type StatsRow = {
	id: string;
	name: string;
	number: number;
	positions: string;
	firstTeamApps: number;
	firstTeamGoals: number;
	secondTeamApps: number;
	secondTeamGoals: number;
	seasonApps: number;
	seasonGoals: number;
	preSeasonApps: number;
	preSeasonGoals: number;
	careerApps: number;
	careerGoals: number;
	assists: number;
	starts: number;
	bench: number;
	minutes: number;
	motm: number;
	yellowCards: number;
	redCards: number;
};

type SortKey = keyof StatsRow;

const columns: {
	label: string;
	key: SortKey;
	align?: "left" | "right" | "center";
}[] = [
	{ label: "Player", key: "name", align: "left" },
	{ label: "No.", key: "number", align: "center" },
	{ label: "Positions", key: "positions", align: "left" },

	{ label: "App", key: "firstTeamApps", align: "center" },
	{ label: "Goals", key: "firstTeamGoals", align: "center" },

	{ label: "App", key: "secondTeamApps", align: "center" },
	{ label: "Goals", key: "secondTeamGoals", align: "center" },

	{ label: "App", key: "seasonApps", align: "center" },
	{ label: "Goals", key: "seasonGoals", align: "center" },

	{ label: "App", key: "preSeasonApps", align: "center" },
	{ label: "Goals", key: "preSeasonGoals", align: "center" },

	{ label: "App", key: "careerApps", align: "center" },
	{ label: "Goals", key: "careerGoals", align: "center" },

	{ label: "Assists", key: "assists", align: "center" },
	{ label: "Starts", key: "starts", align: "center" },
	{ label: "Bench", key: "bench", align: "center" },
	{ label: "MOTM", key: "motm", align: "center" },
	{ label: "Minutes", key: "minutes", align: "center" },
	{ label: "YC", key: "yellowCards", align: "center" },
	{ label: "RC", key: "redCards", align: "center" },
];

export default function Stats() {
	const players = usePlayerStore((state) => state.players);
	const matches = useMatchStore((state) => state.matches);

	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const setActiveSeason = useSeasonStore((state) => state.setActiveSeason);

	const [sortKey, setSortKey] = useState<SortKey>("careerApps");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
	const [includeInactive, setIncludeInactive] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");

	const activeSeason = seasons.find((season) => season.id === activeSeasonId);

	const completedSeasonMatches = useMemo(() => {
		return matches.filter(
			(match) =>
				(match.seasonId ?? DEFAULT_SEASON_ID) === activeSeasonId &&
				match.isCompleted
		);
	}, [matches, activeSeasonId]);

	const firstTeamMatches = useMemo(() => {
		return completedSeasonMatches.filter((match) => match.team === "first");
	}, [completedSeasonMatches]);

	const secondTeamMatches = useMemo(() => {
		return completedSeasonMatches.filter((match) => match.team === "second");
	}, [completedSeasonMatches]);

	const statsRows = useMemo(() => {
		return players
			.filter((player) => includeInactive || player.isActive)
			.map((player) => {
				const preSeasonStats = getPreSeasonPlayerStats(player.name);

				const firstTeamApps = getPlayerAppearancesInMatches(
					firstTeamMatches,
					player.id
				);

				const secondTeamApps = getPlayerAppearancesInMatches(
					secondTeamMatches,
					player.id
				);

				const firstTeamGoals = getPlayerGoalsInMatches(
					firstTeamMatches,
					player.id
				);

				const secondTeamGoals = getPlayerGoalsInMatches(
					secondTeamMatches,
					player.id
				);

				const seasonApps = firstTeamApps + secondTeamApps;
				const seasonGoals = firstTeamGoals + secondTeamGoals;

				const playerMatchStats = completedSeasonMatches.flatMap((match) =>
					(match.playerStats ?? []).filter(
						(stat) => stat.playerId === player.id
					)
				);

				const starts = completedSeasonMatches.filter((match) =>
					match.selectedPlayers.some(
						(selectedPlayer) =>
							selectedPlayer.playerId === player.id &&
							selectedPlayer.area === "pitch"
					)
				).length;

				const bench = completedSeasonMatches.filter((match) =>
					match.selectedPlayers.some(
						(selectedPlayer) =>
							selectedPlayer.playerId === player.id &&
							selectedPlayer.area === "bench"
					)
				).length;

				const assists = playerMatchStats.reduce(
					(total, stat) => total + stat.assists,
					0
				);

				const yellowCards = playerMatchStats.reduce(
					(total, stat) => total + stat.yellowCards,
					0
				);

				const redCards = playerMatchStats.reduce(
					(total, stat) => total + stat.redCards,
					0
				);

				const minutes = playerMatchStats.reduce(
					(total, stat) => total + stat.minutes,
					0
				);

				const motm = playerMatchStats.filter((stat) => stat.isMOTM).length;

				return {
					id: player.id,
					name: player.name,
					number: player.number,
					positions: player.positions.join(", "),
					firstTeamApps,
					firstTeamGoals,
					secondTeamApps,
					secondTeamGoals,
					seasonApps,
					seasonGoals,
					preSeasonApps: preSeasonStats.appearances,
					preSeasonGoals: preSeasonStats.goals,
					careerApps: preSeasonStats.appearances + seasonApps,
					careerGoals: preSeasonStats.goals + seasonGoals,
					assists,
					starts,
					bench,
					minutes,
					motm,
					yellowCards,
					redCards,
				};
			});
	}, [
		players,
		firstTeamMatches,
		secondTeamMatches,
		completedSeasonMatches,
		includeInactive,
	]);

	const filteredRows = useMemo(() => {
		return statsRows.filter((row) =>
			row.name.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}, [statsRows, searchTerm]);

	const sortedRows = useMemo(() => {
		return [...filteredRows].sort((firstRow, secondRow) => {
			const firstValue = firstRow[sortKey];
			const secondValue = secondRow[sortKey];

			if (typeof firstValue === "number" && typeof secondValue === "number") {
				return sortDirection === "asc"
					? firstValue - secondValue
					: secondValue - firstValue;
			}

			return sortDirection === "asc"
				? String(firstValue).localeCompare(String(secondValue))
				: String(secondValue).localeCompare(String(firstValue));
		});
	}, [filteredRows, sortKey, sortDirection]);

	const totalFirstTeamApps = statsRows.reduce(
		(total, row) => total + row.firstTeamApps,
		0
	);

	const totalSecondTeamApps = statsRows.reduce(
		(total, row) => total + row.secondTeamApps,
		0
	);

	const totalSeasonApps = statsRows.reduce(
		(total, row) => total + row.seasonApps,
		0
	);

	const totalPreSeasonApps = statsRows.reduce(
		(total, row) => total + row.preSeasonApps,
		0
	);

	const totalCareerApps = statsRows.reduce(
		(total, row) => total + row.careerApps,
		0
	);

	const totalSeasonGoals = statsRows.reduce(
		(total, row) => total + row.seasonGoals,
		0
	);

	const totalPreSeasonGoals = statsRows.reduce(
		(total, row) => total + row.preSeasonGoals,
		0
	);

	const totalCareerGoals = statsRows.reduce(
		(total, row) => total + row.careerGoals,
		0
	);

	function handleSort(key: SortKey) {
		if (key === sortKey) {
			setSortDirection((currentDirection) =>
				currentDirection === "asc" ? "desc" : "asc"
			);
			return;
		}

		setSortKey(key);
		setSortDirection("desc");
	}

	return (
		<div className="w-full min-w-0 space-y-6 overflow-hidden">
			<div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
				<div className="min-w-0">
					<h1 className="text-2xl font-bold text-blue-900">Stats</h1>

					<p className="text-gray-600">
						Player stats split by first team, second team, pre-season history
						and career totals.
					</p>
				</div>

				<label className="block shrink-0">
					<span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
						Active season
					</span>

					<select
						value={activeSeasonId}
						onChange={(event) => setActiveSeason(event.target.value)}
						className="min-w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm"
					>
						{seasons.map((season) => (
							<option key={season.id} value={season.id}>
								{season.name}
							</option>
						))}
					</select>
				</label>
			</div>

			<section className="min-w-0 rounded-xl bg-white p-4 shadow">
				<div className="flex min-w-0 flex-wrap items-center justify-between gap-4">
					<div className="min-w-0">
						<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
							Stats view
						</p>

						<h2 className="mt-1 text-lg font-bold text-slate-900">
							{activeSeason?.name ?? "No active season"}
						</h2>

						<p className="mt-1 max-w-5xl text-sm text-slate-500">
							Pre 25/26 apps and goals are historical values from your previous
							stats sheet. 25/26 apps and goals are calculated from completed
							match reports in the active season. Career totals combine both.
						</p>
					</div>

					<span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
						{completedSeasonMatches.length} completed matches
					</span>
				</div>
			</section>

			<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
				<StatsCard label="First Team Apps" value={totalFirstTeamApps} />
				<StatsCard label="Second Team Apps" value={totalSecondTeamApps} />
				<StatsCard label="Total 25/26 Apps" value={totalSeasonApps} />
				<StatsCard label="Pre 25/26 Apps" value={totalPreSeasonApps} />
			</div>

			<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
				<StatsCard label="Career Apps" value={totalCareerApps} />
				<StatsCard label="25/26 Goals" value={totalSeasonGoals} />
				<StatsCard label="Pre 25/26 Goals" value={totalPreSeasonGoals} />
				<StatsCard label="Career Goals" value={totalCareerGoals} />
			</div>

			<div className="flex min-w-0 flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow">
				<input
					value={searchTerm}
					onChange={(event) => setSearchTerm(event.target.value)}
					placeholder="Search players..."
					className="w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm sm:w-72"
				/>

				<label className="flex items-center gap-2 text-sm font-medium text-slate-700">
					<input
						type="checkbox"
						checked={includeInactive}
						onChange={(event) => setIncludeInactive(event.target.checked)}
					/>
					Include inactive players
				</label>
			</div>

			<div className="min-w-0 overflow-hidden rounded-xl bg-white shadow">
				{sortedRows.length === 0 ? (
					<div className="p-6 text-center text-sm text-slate-500">
						No player stats found for this season.
					</div>
				) : (
					<div className="max-w-full overflow-x-auto">
						<table className="min-w-[1500px] text-sm">
							<thead className="border-b bg-gray-50">
								<tr className="border-b border-slate-200">
									<th colSpan={3} className="bg-slate-50 p-2" />

									<GroupHeader label="First team" />
									<GroupHeader label="Second team" />
									<GroupHeader label="Total 25/26" />
									<GroupHeader label="Pre 25/26" />
									<GroupHeader label="Career" />

									<th colSpan={7} className="bg-slate-50 p-2" />
								</tr>

								<tr>
									{columns.map((column) => (
										<th
											key={column.key}
											className={`whitespace-nowrap p-3 ${
												getAlignClass(column.align)
											}`}
										>
											<button
												type="button"
												onClick={() => handleSort(column.key)}
												className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-900"
											>
												{column.label}

												{sortKey === column.key && (
													<span className="text-xs">
														{sortDirection === "asc" ? "↑" : "↓"}
													</span>
												)}
											</button>
										</th>
									))}
								</tr>
							</thead>

							<tbody>
								{sortedRows.map((row) => (
									<tr key={row.id} className="border-b hover:bg-gray-50">
										<td className="whitespace-nowrap p-3 font-medium text-blue-900">
											{row.name}
										</td>

										<td className="p-3 text-center">{row.number}</td>

										<td className="whitespace-nowrap p-3 text-slate-600">
											{row.positions}
										</td>

										<td className="p-3 text-center">{row.firstTeamApps}</td>
										<td className="p-3 text-center">{row.firstTeamGoals}</td>

										<td className="p-3 text-center">{row.secondTeamApps}</td>
										<td className="p-3 text-center">{row.secondTeamGoals}</td>

										<td className="p-3 text-center font-semibold">
											{row.seasonApps}
										</td>
										<td className="p-3 text-center font-semibold">
											{row.seasonGoals}
										</td>

										<td className="p-3 text-center">{row.preSeasonApps}</td>
										<td className="p-3 text-center">{row.preSeasonGoals}</td>

										<td className="p-3 text-center font-semibold text-slate-900">
											{row.careerApps}
										</td>
										<td className="p-3 text-center font-semibold text-slate-900">
											{row.careerGoals}
										</td>

										<td className="p-3 text-center">{row.assists}</td>
										<td className="p-3 text-center">{row.starts}</td>
										<td className="p-3 text-center">{row.bench}</td>
										<td className="p-3 text-center">{row.motm}</td>
										<td className="p-3 text-center">{row.minutes}</td>
										<td className="p-3 text-center">{row.yellowCards}</td>
										<td className="p-3 text-center">{row.redCards}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}

function getPlayerAppearancesInMatches(
	matches: {
		selectedPlayers: {
			playerId: string;
		}[];
	}[],
	playerId: string
) {
	return matches.filter((match) =>
		match.selectedPlayers.some(
			(selectedPlayer) => selectedPlayer.playerId === playerId
		)
	).length;
}

function getPlayerGoalsInMatches(
	matches: {
		playerStats?: {
			playerId: string;
			goals: number;
		}[];
	}[],
	playerId: string
) {
	return matches.reduce((total, match) => {
		const playerStat = match.playerStats?.find(
			(stat) => stat.playerId === playerId
		);

		return total + (playerStat?.goals ?? 0);
	}, 0);
}

function StatsCard({
	label,
	value,
}: {
	label: string;
	value: string | number;
}) {
	return (
		<div className="min-w-0 rounded-xl bg-white p-5 shadow">
			<p className="truncate text-sm font-medium text-gray-500">{label}</p>
			<p className="mt-2 text-3xl font-bold text-blue-900">{value}</p>
		</div>
	);
}

function GroupHeader({ label }: { label: string }) {
	return (
		<th
			colSpan={2}
			className="bg-yellow-100 p-2 text-center text-xs font-bold uppercase tracking-wide text-slate-700"
		>
			{label}
		</th>
	);
}

function getAlignClass(align?: "left" | "right" | "center") {
	if (align === "right") {
		return "text-right";
	}

	if (align === "center") {
		return "text-center";
	}

	return "text-left";
}