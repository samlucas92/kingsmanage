import { useState } from "react";
import { Link } from "react-router-dom";
import ReportBarChart from "../../components/charts/ReportBarChart";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportAnswerCard from "../../components/ReportAnswerCard";
import ReportDetails from "../../components/ReportDetails";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportPanel from "../../components/ReportPanel";
import ReportLoadState from "../../components/ReportLoadState";
import ReportMobileRankedList from "../../components/ReportMobileRankedList";
import { useReportsContext } from "../../ReportsContext";
import { useReportResource } from "../../hooks/useReportResource";
import { reportsApi, type PlayerAwardCount, type PlayerContribution, type PlayerReportsResponse } from "../../../../services/reportsApi";

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
	const leadingPlayer = report?.topContributors[0];

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
			<ReportAnswerCard
				eyebrow="Who is leading the way?"
				value={leadingPlayer ? leadingPlayer.playerName : "No player stats yet"}
				description={leadingPlayer ? `${leadingPlayer.contributions} goal contributions from ${leadingPlayer.appearances} appearances.` : "Record match player stats to build useful rankings."}
				tone={leadingPlayer ? "success" : "default"}
				stats={[
					{ label: "Goals", value: report?.summary.goals ?? 0, tone: "success" },
					{ label: "Assists", value: report?.summary.assists ?? 0 },
					{ label: "Appearances", value: report?.summary.appearances ?? 0 },
					{ label: "Active players", value: report?.summary.activePlayers ?? 0 },
				]}
			/>
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
			<ReportDetails title="Awards and contributor detail" description="Award leaders and the underlying goals, assists and appearances.">
			<div className="space-y-4">
			<ReportPanel
				title="Player awards"
				description="Top 5 from closed player-award forms."
				action={<Link to="/reports/player-awards" className="text-xs font-black text-yepset-700 hover:text-yepset-900">View full report</Link>}
			>
				<div className="grid gap-4 lg:grid-cols-2">
					<AwardPreviewList
						title="Man of the match"
						rows={(report?.awards.manOfTheMatch ?? []).slice(0, 5)}
						emptyMessage="No man of the match awards yet."
					/>
					<AwardPreviewList
						title="Dick of the day"
						rows={(report?.awards.dickOfTheDay ?? []).slice(0, 5)}
						emptyMessage="No dick of the day awards yet."
					/>
				</div>
			</ReportPanel>
			<ReportPanel title="Top contributors" description="Goals plus assists, with appearances for context.">
				<div className="sm:hidden">
					<ReportMobileRankedList items={(report?.topContributors ?? []).slice(0, 8).map((player) => ({
						id: player.playerId,
						label: player.playerName,
						value: player.contributions,
						helper: `${player.goals} goals · ${player.assists} assists · ${player.appearances} apps`,
					}))} />
				</div>
				<div className="hidden divide-y divide-slate-100 rounded-2xl border border-slate-200 sm:block">
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
			</ReportDetails>
		</div>
	);
}

function AwardPreviewList({
	title,
	rows,
	emptyMessage,
}: {
	title: string;
	rows: PlayerAwardCount[];
	emptyMessage: string;
}) {
	return (
		<div>
			<h3 className="text-sm font-black text-slate-950">{title}</h3>
			{rows.length === 0 ? (
				<p className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
					{emptyMessage}
				</p>
			) : (
				<div className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-200">
					{rows.map((row, index) => (
						<div key={row.playerId} className="grid grid-cols-[2rem_1fr_3rem] items-center gap-2 px-3 py-2 text-sm">
							<span className="font-black text-slate-400">{index + 1}</span>
							<Link to={`/players/${row.playerId}`} className="min-w-0 truncate font-black text-slate-950 hover:text-yepset-700">
								{row.playerName}
							</Link>
							<span className="text-right font-black text-yepset-700">{row.count}</span>
						</div>
					))}
				</div>
			)}
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
