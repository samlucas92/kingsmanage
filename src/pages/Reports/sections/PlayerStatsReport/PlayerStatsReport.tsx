import { useEffect, useState } from "react";
import ReportBarChart from "../../components/charts/ReportBarChart";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportMetricCard from "../../components/ReportMetricCard";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportPanel from "../../components/ReportPanel";
import ReportsFilterBar from "../../components/ReportsFilterBar";
import { useReportsContext } from "../../ReportsContext";
import { reportsApi, type PlayerContribution, type PlayerReportsResponse } from "../../../../services/reportsApi";

type RankingMode = "contributions" | "goals" | "assists" | "appearances";

const rankingModes: Array<{ key: RankingMode; label: string }> = [
	{ key: "contributions", label: "Contributions" },
	{ key: "goals", label: "Goals" },
	{ key: "assists", label: "Assists" },
	{ key: "appearances", label: "Appearances" },
];

export default function PlayerStatsReport() {
	const { selectedSeasonId, selectedTeamId, selectedPlayerId } = useReportsContext();
	const [report, setReport] = useState<PlayerReportsResponse | null>(null);
	const [isLoadingReport, setIsLoadingReport] = useState(false);
	const [reportError, setReportError] = useState("");
	const [rankingMode, setRankingMode] = useState<RankingMode>("contributions");
	const [includeFriendlies, setIncludeFriendlies] = useState(true);
	const rankingRows = getRankingRows(report?.topContributors ?? [], rankingMode);

	useEffect(() => {
		if (!selectedSeasonId) {
			setReport(null);
			return;
		}

		let isCurrent = true;
		setIsLoadingReport(true);
		setReportError("");

		reportsApi.getPlayerReports({
			seasonId: selectedSeasonId,
			teamId: selectedTeamId,
			playerId: selectedPlayerId,
			includeFriendlies,
		})
			.then((response) => {
				if (isCurrent) setReport(response);
			})
			.catch((error) => {
				if (isCurrent) {
					setReportError(error instanceof Error ? error.message : "Failed to load player reports.");
					setReport(null);
				}
			})
			.finally(() => {
				if (isCurrent) setIsLoadingReport(false);
			});

		return () => {
			isCurrent = false;
		};
	}, [includeFriendlies, selectedPlayerId, selectedSeasonId, selectedTeamId]);

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Player Stats"
				description="Goals, assists, appearances and match records."
				showTeamFilter
				showPlayerFilter
			>
				<div className="flex flex-col items-stretch gap-3 lg:items-end">
					<ReportsFilterBar showTeamFilter showPlayerFilter />
					<label className="inline-flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm">
						<span>Include friendlies</span>
						<input
							type="checkbox"
							checked={includeFriendlies}
							onChange={(event) => setIncludeFriendlies(event.target.checked)}
							className="h-4 w-4 rounded border-slate-300 text-yepset-700 focus:ring-yepset-600"
						/>
					</label>
				</div>
			</ReportPageHeader>
			{reportError && (
				<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
					{reportError}
				</div>
			)}
			{isLoadingReport && (
				<div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500">
					Loading player reports...
				</div>
			)}
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<ReportMetricCard label="Active players" value={report?.summary.activePlayers ?? 0} />
				<ReportMetricCard label="Appearances" value={report?.summary.appearances ?? 0} />
				<ReportMetricCard label="Goals" value={report?.summary.goals ?? 0} tone={(report?.summary.goals ?? 0) > 0 ? "success" : "default"} />
				<ReportMetricCard label="Goal contributions" value={report?.summary.contributions ?? 0} helper={`${report?.summary.assists ?? 0} assists`} />
			</div>
			<ReportChartContainer
				title="Top player rankings"
				description="Switch between goals, assists, appearances and combined contributions."
				action={
					<div className="flex flex-wrap gap-1">
						{rankingModes.map((mode) => (
							<button
								key={mode.key}
								type="button"
								onClick={() => setRankingMode(mode.key)}
								className={`rounded-full px-3 py-1 text-xs font-black transition ${
									rankingMode === mode.key
										? "bg-yepset-700 text-white"
										: "border border-slate-200 bg-white text-slate-600 hover:border-yepset-200 hover:text-yepset-700"
								}`}
							>
								{mode.label}
							</button>
						))}
					</div>
				}
				isEmpty={rankingRows.length === 0}
			>
				<ReportBarChart
					ariaLabel="Top player ranking"
					labels={rankingRows.map((playerStats) => shortName(playerStats.playerName))}
					series={[
						{
							label: getRankingLabel(rankingMode),
							colour: "#147764",
							values: rankingRows.map((playerStats) => getRankingValue(playerStats, rankingMode)),
						},
					]}
				/>
			</ReportChartContainer>
			<ReportPanel title="Top contributors" description="Goals plus assists, with appearances for context.">
				<div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
					{(report?.topContributors ?? []).slice(0, 8).map((player, index) => (
						<div key={player.playerId} className="grid grid-cols-[2rem_1fr_repeat(4,4rem)] items-center gap-2 px-4 py-3 text-sm">
							<span className="font-black text-slate-400">{index + 1}</span>
							<span className="min-w-0 truncate font-black text-slate-950">{player.playerName}</span>
							<span className="text-center font-black text-yepset-700">{player.goals}</span>
							<span className="text-center font-black text-blue-700">{player.assists}</span>
							<span className="text-center font-black text-slate-950">{player.contributions}</span>
							<span className="text-center font-bold text-slate-500">{player.appearances}</span>
						</div>
					))}
				</div>
			</ReportPanel>
		</div>
	);
}

function getRankingRows(rows: PlayerContribution[], mode: RankingMode) {
	return [...rows]
		.sort((firstPlayer, secondPlayer) =>
			getRankingValue(secondPlayer, mode) - getRankingValue(firstPlayer, mode) ||
			secondPlayer.contributions - firstPlayer.contributions ||
			firstPlayer.playerName.localeCompare(secondPlayer.playerName)
		)
		.slice(0, 8);
}

function getRankingValue(player: PlayerContribution, mode: RankingMode) {
	if (mode === "goals") return player.goals;
	if (mode === "assists") return player.assists;
	if (mode === "appearances") return player.appearances;
	return player.contributions;
}

function getRankingLabel(mode: RankingMode) {
	if (mode === "goals") return "Goals";
	if (mode === "assists") return "Assists";
	if (mode === "appearances") return "Appearances";
	return "Contributions";
}

function shortName(name: string) {
	const [firstName, ...rest] = name.split(" ");
	const lastName = rest.at(-1);

	return lastName ? `${firstName[0]}. ${lastName}` : name;
}
