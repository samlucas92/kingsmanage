import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SeasonSelector from "../../components/compositions/SeasonSelector";
import MetricCard from "../../components/compositions/MetricCard";
import DataTable from "../../components/compositions/DataTable";
import PanelCard from "../../components/compositions/PanelCard";
import { useMatchStore } from "../../stores/match";
import { useSeasonStore } from "../../stores/seasons";
import { useStatsStore } from "../../stores/stats";
import { getClubTeamLabel, useClubTeamStore } from "../../stores/clubTeams";
import { getCompletedMatchesForSeason } from "../../services/statsService";
import {
	buildCsvText,
	buildSeparatedTableText,
	downloadTextFile,
	slugify,
	type ExportColumn,
} from "../../services/exportService";
import type { PlayerStatsRecord } from "../../services/statsApi";

type StatsRow = PlayerStatsRecord & {
	id: string;
	name: string;
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
	{ label: "Unused", key: "unusedSubstitutes", align: "center" },
	{ label: "MOTM", key: "motm", align: "center" },
	{ label: "Minutes", key: "minutes", align: "center" },
	{ label: "YC", key: "yellowCards", align: "center" },
	{ label: "RC", key: "redCards", align: "center" },
];

function getExportColumns(
	selectedSeasonName: string,
	firstTeamName: string,
	secondTeamName: string
): ExportColumn<StatsRow>[] {
	return [
		{
			label: "Player",
			getValue: (row) => row.name,
		},
		{
			label: `${firstTeamName} Apps`,
			getValue: (row) => row.firstTeamApps,
		},
		{
			label: `${firstTeamName} Goals`,
			getValue: (row) => row.firstTeamGoals,
		},
		{
			label: `${secondTeamName} Apps`,
			getValue: (row) => row.secondTeamApps,
		},
		{
			label: `${secondTeamName} Goals`,
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
			label: "Unused Substitutes",
			getValue: (row) => row.unusedSubstitutes,
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

type StatsProps = {
	variant?: "standalone" | "report";
	selectedSeasonId?: string;
	onSeasonChange?: (seasonId: string) => void;
	selectedPlayerId?: string;
	hideHeader?: boolean;
};

export default function Stats({
	variant = "standalone",
	selectedSeasonId: controlledSelectedSeasonId,
	onSeasonChange,
	selectedPlayerId = "all",
	hideHeader = false,
}: StatsProps = {}) {
	const clubTeamProfiles = useClubTeamStore((state) => state.profiles);
	const firstTeamName = getClubTeamLabel(clubTeamProfiles, "first");
	const secondTeamName = getClubTeamLabel(clubTeamProfiles, "second");
	const matches = useMatchStore((state) => state.matches);
	const loadMatches = useMatchStore((state) => state.loadMatches);
	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);
	const seasonStats = useStatsStore((state) => state.seasonStats);
	const loadSeasonStats = useStatsStore((state) => state.loadSeasonStats);
	const [sortKey, setSortKey] = useState<SortKey>("careerApps");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
	const [includeInactive, setIncludeInactive] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [copyStatus, setCopyStatus] = useState("");
	const [internalSelectedSeasonId, setInternalSelectedSeasonId] = useState("");
	const selectedSeasonId = controlledSelectedSeasonId ?? internalSelectedSeasonId;
	const setSelectedSeasonId = onSeasonChange ?? setInternalSelectedSeasonId;

	const selectedSeason = seasons.find((season) => season.id === selectedSeasonId);
	const selectedSeasonName = selectedSeason?.name ?? "Selected season";

	useEffect(() => {
		void loadSeasons();
	}, [loadSeasons]);

	useEffect(() => {
		if (selectedSeasonId && seasons.some((season) => season.id === selectedSeasonId)) {
			return;
		}

		setSelectedSeasonId(activeSeasonId || seasons[0]?.id || "");
	}, [activeSeasonId, seasons, selectedSeasonId]);

	useEffect(() => {
		if (!selectedSeasonId) {
			return;
		}

		void loadSeasonStats(selectedSeasonId, true);
		void loadMatches(selectedSeasonId);
	}, [selectedSeasonId, loadMatches, loadSeasonStats]);

	const completedSeasonMatches = useMemo(() => {
		if (!selectedSeasonId) {
			return [];
		}

		return getCompletedMatchesForSeason(matches, selectedSeasonId);
	}, [matches, selectedSeasonId]);

	const statsRows = useMemo<StatsRow[]>(() => {
		return seasonStats
			.filter((playerStats) => includeInactive || playerStats.isActive)
			.map((playerStats) => ({
				...playerStats,
				id: playerStats.playerId,
				name: playerStats.playerName,
			}));
	}, [seasonStats, includeInactive]);

	const filteredRows = useMemo(() => {
		return statsRows.filter((row) => {
			if (selectedPlayerId !== "all" && row.playerId !== selectedPlayerId) {
				return false;
			}

			return row.name.toLowerCase().includes(searchTerm.toLowerCase());
		});
	}, [statsRows, searchTerm, selectedPlayerId]);

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
		const exportColumns = getExportColumns(selectedSeasonName, firstTeamName, secondTeamName);
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
		const exportColumns = getExportColumns(selectedSeasonName, firstTeamName, secondTeamName);
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
			{!hideHeader && (
				<div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
					<div className="min-w-0">
						{variant === "report" && (
							<p className="text-xs font-black uppercase tracking-wide text-yepset-700">Reports</p>
						)}
						<h1 className="text-2xl font-black tracking-[-.03em] text-slate-950">
							{variant === "report" ? "Player Stats" : "Stats"}
						</h1>
						<p className="text-gray-600">
							{variant === "report"
								? "Goals, assists, appearances and match records for the selected report season."
								: "Player stats split by selected season, pre-25/26 history and career totals across every tracked season."}
						</p>
					</div>

					<SeasonSelector
						label="Filter season"
						selectedSeasonId={selectedSeasonId}
						onSeasonChange={setSelectedSeasonId}
					/>
				</div>
			)}

			<PanelCard>
				<div className="flex min-w-0 flex-wrap items-center justify-between gap-4">
					<div className="min-w-0">
						<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
							{variant === "report" ? "Player stats report" : "Stats view"}
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
			</PanelCard>

			<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
				{clubTeamProfiles.map((profile) => (
					<MetricCard
						key={profile.id}
						label={`${profile.displayName} Apps`}
						value={statsRows.reduce((total, row) => total + (row.teamStats ?? [])
							.filter((teamStats) => teamStats.teamId === profile.id)
							.reduce((teamTotal, teamStats) => teamTotal + teamStats.appearances, 0), 0)}
					/>
				))}
				<MetricCard
					label={`${selectedSeasonName} Apps`}
					value={totalSeasonApps}
				/>
				<MetricCard label="Pre 25/26 Apps" value={totalPreSeasonApps} />
			</div>

			<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
				<MetricCard label="Tracked Apps" value={totalTrackedCareerApps} />
				<MetricCard label="Career Apps" value={totalCareerApps} />
				<MetricCard
					label={`${selectedSeasonName} Goals`}
					value={totalSeasonGoals}
				/>
				<MetricCard label="Career Goals" value={totalCareerGoals} />
			</div>

			<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
				<MetricCard label="Pre 25/26 Goals" value={totalPreSeasonGoals} />
				<MetricCard label="Tracked Goals" value={totalTrackedCareerGoals} />
			</div>

			<PanelCard contentClassName="flex min-w-0 flex-wrap items-center gap-4">
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
			</PanelCard>

			<div className="min-w-0 overflow-hidden rounded-xl bg-white shadow">
				<DataTable
					empty={sortedRows.length === 0}
					emptyTitle="No player stats found"
					emptyMessage="No player stats found for this season."
					minWidthClassName="min-w-[1300px]"
					className="max-h-[72vh] overflow-auto"
				>
					<thead>
						<tr className="border-b border-slate-200">
							<th className="sticky left-0 top-0 z-40 w-[180px] min-w-[180px] max-w-[180px] bg-slate-50 p-2 shadow-[1px_0_0_0_rgba(226,232,240,1)]" />
							<GroupHeader label={firstTeamName} />
							<GroupHeader label={secondTeamName} />
							<GroupHeader label={selectedSeasonName} />
							<GroupHeader label="Pre 25/26" />
							<GroupHeader label="Career" />
							<th
								colSpan={7}
								className="sticky top-0 z-30 bg-slate-50 p-2"
							/>
						</tr>
						<tr className="border-b bg-gray-50">
							{columns.map((column) => (
								<th
									key={column.key}
									className={`sticky top-[33px] z-30 whitespace-nowrap bg-gray-50 p-3 ${
										column.key === "name"
											? "left-0 z-40 w-[180px] min-w-[180px] max-w-[180px] shadow-[1px_0_0_0_rgba(226,232,240,1)]"
											: ""
									} ${getAlignClass(column.align)}`}
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
								<td className="sticky left-0 z-20 w-[180px] min-w-[180px] max-w-[180px] whitespace-nowrap bg-white p-3 font-medium shadow-[1px_0_0_0_rgba(226,232,240,1)]">
									<Link
										to={`/players/${row.id}`}
										className="block truncate text-blue-900 hover:text-blue-700 hover:underline"
										title={row.name}
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
								<td className="p-3 text-center">{row.unusedSubstitutes}</td>
								<td className="p-3 text-center">{row.motm}</td>
								<td className="p-3 text-center">{row.minutes}</td>
								<td className="p-3 text-center">{row.yellowCards}</td>
								<td className="p-3 text-center">{row.redCards}</td>
							</tr>
						))}
					</tbody>
				</DataTable>
			</div>
		</div>
	);
}

function GroupHeader({ label }: { label: string }) {
	return (
		<th
			colSpan={2}
			className="sticky top-0 z-30 bg-yellow-100 p-2 text-center text-xs font-bold uppercase tracking-wide text-slate-700"
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
