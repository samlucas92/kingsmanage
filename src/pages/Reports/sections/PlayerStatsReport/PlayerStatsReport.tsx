import { useState } from "react";
import ReportBarChart from "../../components/charts/ReportBarChart";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportMetricCard from "../../components/ReportMetricCard";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportPanel from "../../components/ReportPanel";
import ReportLoadState from "../../components/ReportLoadState";
import ReportMobileRankedList from "../../components/ReportMobileRankedList";
import { useReportsContext } from "../../ReportsContext";
import { useReportResource } from "../../hooks/useReportResource";
import { reportsApi, type PlayerContribution, type PlayerReportsResponse } from "../../../../services/reportsApi";

type RankingMode = "contributions" | "goals" | "assists" | "appearances";

const rankingModes: Array<{ key: RankingMode; label: string }> = [
	{ key: "contributions", label: "Contributions" },
	{ key: "goals", label: "Goals" },
	{ key: "assists", label: "Assists" },
	{ key: "appearances", label: "Appearances" },
];

export default function PlayerStatsReport() {
	const { selectedSeasonId, selectedTeamId, selectedPlayerId, includeFriendlies } = useReportsContext();
	const [rankingMode, setRankingMode] = useState<RankingMode>("contributions");
	const { report, isLoadingReport, reportError } = useReportResource<PlayerReportsResponse>({
		canLoad: Boolean(selectedSeasonId),
		errorMessage: "Failed to load player reports.",
		dependencies: [includeFriendlies, selectedPlayerId, selectedSeasonId, selectedTeamId],
		load: () =>
			reportsApi.getPlayerReports({
				seasonId: selectedSeasonId,
				teamId: selectedTeamId,
				playerId: selectedPlayerId,
				includeFriendlies,
			}),
	});
	const rankingRows = getRankingRows(report?.topContributors ?? [], rankingMode);

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Player Stats"
				description="Goals, assists, appearances and match records."
				showTeamFilter
				showPlayerFilter
			/>
			<ReportLoadState
				error={reportError}
				isLoading={isLoadingReport}
				loadingMessage="Loading player reports..."
			/>
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
				<div className="sm:hidden">
					<ReportMobileRankedList
						items={rankingRows.map((playerStats) => ({
							id: playerStats.playerId,
							label: playerStats.playerName,
							value: getRankingValue(playerStats, rankingMode),
							helper: getRankingLabel(rankingMode),
						}))}
					/>
				</div>
				<div className="hidden sm:block">
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
				</div>
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
