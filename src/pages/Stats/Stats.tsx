import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePlayerStore } from "../../stores/players";
import { useMatchStore } from "../../stores/match";
import { useSeasonStore } from "../../stores/seasons";
import { useHistoricalStatsStore } from "../../stores/historicalStats";
import SeasonSelector from "../../components/compositions/SeasonSelector";
import {
	getCompletedMatchesForSeason,
	getPlayerStatsSummary,
} from "../../services/statsService";
import {
	buildCsvText,
	buildSeparatedTableText,
	downloadTextFile,
	slugify,
	type ExportColumn,
} from "../../services/exportService";

type StatsRow = {
	id: string;
	name: string;
	firstTeamApps: number;
	firstTeamGoals: number;
	secondTeamApps: number;
	secondTeamGoals: number;
	seasonApps: number;
	seasonGoals: number;
	preSeasonApps: number;
	preSeasonGoals: number;
	trackedCareerApps: number;
	trackedCareerGoals: number;
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

function getExportColumns(selectedSeasonName: string): ExportColumn<StatsRow>[] {
	return [
		{
			label: "Player",
			getValue: (row) => row.name,
		},
		{
			label: "First Team Apps",
			getValue: (row) => row.firstTeamApps,
		},
		{
			label: "First Team Goals",
			getValue: (row) => row.firstTeamGoals,
		},
		{
			label: "Second Team Apps",
			getValue: (row) => row.secondTeamApps,
		},
		{
			label: "Second Team Goals",
			getValue: (row) => row.secondTeamGoals,
		},
		{
			label: `${selectedSeasonName} Apps`,
			getValue: (row) => row.seasonApps,
		},
		{
			label: `${selectedSeasonName} Goals`,
			getValue: (row) => row.seasonGoals,
		},
		{
			label: "Pre 25/26 Apps",
			getValue: (row) => row.preSeasonApps,
		},
		{
			label: "Pre 25/26 Goals",
			getValue: (row) => row.preSeasonGoals,
		},
		{
			label: "Career Apps",
			getValue: (row) => row.careerApps,
		},
		{
			label: "Career Goals",
			getValue: (row) => row.careerGoals,
		},
		{
			label: "Assists",
			getValue: (row) => row.assists,
		},
		{
			label: "Starts",
			getValue: (row) => row.starts,
		},
		{
			label: "Bench",
			getValue: (row) => row.bench,
		},
		{
			label: "MOTM",
			getValue: (row) => row.motm,
		},
		{
			label: "Minutes",
			getValue: (row) => row.minutes,
		},
		{
			label: "Yellow Cards",
			getValue: (row) => row.yellowCards,
		},
		{
			label: "Red Cards",
			getValue: (row) => row.redCards,
		},
	];
}

export default function Stats() {
	const players = usePlayerStore((state) => state.players);
	const matches = useMatchStore((state) => state.matches);

	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);

	const historicalPlayerStats = useHistoricalStatsStore(
		(state) => state.historicalPlayerStats
	);
	const initialiseHistoricalStats = useHistoricalStatsStore(
		(state) => state.initialiseHistoricalStats
	);

	const [sortKey, setSortKey] = useState<SortKey>("careerApps");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
	const [includeInactive, setIncludeInactive] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [copyStatus, setCopyStatus] = useState("");

	const activeSeason = seasons.find((season) => season.id === activeSeasonId);
	const selectedSeasonName = activeSeason?.name ?? "Selected season";

	useEffect(() => {
		initialiseHistoricalStats(players);
	}, [players, initialiseHistoricalStats]);

	const completedSeasonMatches = useMemo(() => {
		return getCompletedMatchesForSeason(matches, activeSeasonId);
	}, [matches, activeSeasonId]);

	const statsRows = useMemo(() => {
		return players
			.filter((player) => includeInactive || player.isActive)
			.map((player) => {
				const historicalRecord = historicalPlayerStats.find(
					(record) => record.playerId === player.id
				);

				const summary = getPlayerStatsSummary({
					playerId: player.id,
					playerName: player.name,
					selectedSeasonId: activeSeasonId,
					matches,
					preSeasonStats: historicalRecord
						? {
								appearances: historicalRecord.appearances,
								goals: historicalRecord.goals,
							}
						: undefined,
				});

				return {
					id: player.id,
					name: player.name,
					...summary,
				};
			});
	}, [
		players,
		matches,
		activeSeasonId,
		historicalPlayerStats,
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

	const totalTrackedCareerApps = statsRows.reduce(
		(total, row) => total + row.trackedCareerApps,
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

	const totalTrackedCareerGoals = statsRows.reduce(
		(total, row) => total + row.trackedCareerGoals,
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

	function handleCopyTable() {
		const exportColumns = getExportColumns(selectedSeasonName);

		const tableText = buildSeparatedTableText({
			rows: sortedRows,
			columns: exportColumns,
			separator: "\t",
		});

		navigator.clipboard
			.writeText(tableText)
			.then(() => {
				setCopyStatus("Copied");
				window.setTimeout(() => setCopyStatus(""), 2000);
			})
			.catch(() => {
				setCopyStatus("Copy failed");
				window.setTimeout(() => setCopyStatus(""), 2000);
			});
	}

	function handleExportCsv() {
		const exportColumns = getExportColumns(selectedSeasonName);

		const csvText = buildCsvText({
			rows: sortedRows,
			columns: exportColumns,
		});

		const filename = `kingsbridge-colts-stats-${slugify(
			selectedSeasonName
		)}.csv`;

		downloadTextFile({
			filename,
			content: csvText,
			mimeType: "text/csv;charset=utf-8;",
		});
	}

	return (
		<div className="w-full min-w-0 space-y-6 overflow-hidden">
			<div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
				<div className="min-w-0">
					<h1 className="text-2xl font-bold text-blue-900">Stats</h1>

					<p className="text-gray-600">
						Player stats split by selected season, pre-25/26 history and career
						totals across every tracked season.
					</p>
				</div>

				<SeasonSelector label="Selected season" />
			</div>

			<section className="min-w-0 rounded-xl bg-white p-4 shadow">
				<div className="flex min-w-0 flex-wrap items-center justify-between gap-4">
					<div className="min-w-0">
						<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
							Stats view
						</p>

						<h2 className="mt-1 text-lg font-bold text-slate-900">
							{selectedSeasonName}
						</h2>

						<p className="mt-1 max-w-5xl text-sm text-slate-500">
							{selectedSeasonName} apps and goals are calculated from completed
							matches in this season. Career totals are Pre 25/26 plus all
							completed tracked matches across every season.
						</p>
					</div>

					<span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
						{completedSeasonMatches.length} completed selected-season matches
					</span>
				</div>
			</section>

			<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
				<StatsCard label="First Team Apps" value={totalFirstTeamApps} />
				<StatsCard label="Second Team Apps" value={totalSecondTeamApps} />
				<StatsCard label={`${selectedSeasonName} Apps`} value={totalSeasonApps} />
				<StatsCard label="Pre 25/26 Apps" value={totalPreSeasonApps} />
			</div>

			<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
				<StatsCard label="Tracked Apps" value={totalTrackedCareerApps} />
				<StatsCard label="Career Apps" value={totalCareerApps} />
				<StatsCard
					label={`${selectedSeasonName} Goals`}
					value={totalSeasonGoals}
				/>
				<StatsCard label="Career Goals" value={totalCareerGoals} />
			</div>

			<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
				<StatsCard label="Pre 25/26 Goals" value={totalPreSeasonGoals} />
				<StatsCard label="Tracked Goals" value={totalTrackedCareerGoals} />
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

				<div className="ml-auto flex flex-wrap items-center gap-2">
					{copyStatus && (
						<span className="text-xs font-semibold text-slate-500">
							{copyStatus}
						</span>
					)}

					<button
						type="button"
						onClick={handleCopyTable}
						disabled={sortedRows.length === 0}
						className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Copy table
					</button>

					<button
						type="button"
						onClick={handleExportCsv}
						disabled={sortedRows.length === 0}
						className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Export CSV
					</button>
				</div>
			</div>

			<div className="min-w-0 overflow-hidden rounded-xl bg-white shadow">
				{sortedRows.length === 0 ? (
					<div className="p-6 text-center text-sm text-slate-500">
						No player stats found for this season.
					</div>
				) : (
					<div className="max-w-full overflow-x-auto">
						<table className="min-w-[1300px] text-sm">
							<thead className="border-b bg-gray-50">
								<tr className="border-b border-slate-200">
									<th colSpan={1} className="bg-slate-50 p-2" />

									<GroupHeader label="First team" />
									<GroupHeader label="Second team" />
									<GroupHeader label={selectedSeasonName} />
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
										<td className="whitespace-nowrap p-3 font-medium">
											<Link
												to={`/players/${row.id}`}
												className="text-blue-900 hover:text-blue-700 hover:underline"
											>
												{row.name}
											</Link>
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