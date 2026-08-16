import ReportBarChart from "../../components/charts/ReportBarChart";
import { Link } from "react-router-dom";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportEmptyState from "../../components/ReportEmptyState";
import ReportAnswerCard from "../../components/ReportAnswerCard";
import ReportDetails from "../../components/ReportDetails";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportPanel from "../../components/ReportPanel";
import ReportLoadState from "../../components/ReportLoadState";
import ReportMobileRankedList from "../../components/ReportMobileRankedList";
import { useReportsContext } from "../../ReportsContext";
import { useReportResource } from "../../hooks/useReportResource";
import { reportsApi, type PlayerReportsResponse } from "../../../../services/reportsApi";

export default function DisciplineReport() {
	const { selectedSeasonId, selectedPlayerId, includeFriendlies, isLoading, loadError } = useReportsContext();
	const { report, isLoadingReport, reportError } = useReportResource<PlayerReportsResponse>({
		canLoad: Boolean(selectedSeasonId),
		errorMessage: "Failed to load discipline report.",
		dependencies: [includeFriendlies, selectedPlayerId, selectedSeasonId],
		load: () =>
			reportsApi.getPlayerReports({
				seasonId: selectedSeasonId,
				playerId: selectedPlayerId,
				includeFriendlies,
			}),
	});
	const disciplineRows = report?.discipline.players ?? [];
	const yellowCards = report?.discipline.yellowCards ?? 0;
	const redCards = report?.discipline.redCards ?? 0;
	const mostCardedPlayer = disciplineRows[0];
	const topCardedRows = disciplineRows.slice(0, 8);

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Discipline"
				description="Cards and sanctions from recorded match player stats."
				showTeamFilter={false}
				showPlayerFilter
			/>

			<ReportLoadState
				error={loadError || reportError}
				isLoading={isLoading || isLoadingReport}
			/>

			<ReportAnswerCard
				eyebrow="Discipline overview"
				value={`${yellowCards + redCards} total cards`}
				description={mostCardedPlayer ? `${mostCardedPlayer.playerName} has the most cards with ${mostCardedPlayer.totalCards}.` : "No cards have been recorded for the selected filters."}
				tone={redCards > 0 ? "danger" : yellowCards > 0 ? "warning" : "success"}
				stats={[
					{ label: "Yellow cards", value: yellowCards, tone: yellowCards > 0 ? "warning" : "default" },
					{ label: "Red cards", value: redCards, tone: redCards > 0 ? "danger" : "default" },
				]}
			/>

			<div>
				<ReportChartContainer
					title="Most carded players"
					description="Top players by total cards."
					isEmpty={topCardedRows.length === 0}
				>
					<div className="sm:hidden">
						<ReportMobileRankedList
							items={topCardedRows.map((playerStats) => ({
								id: playerStats.playerId,
								label: playerStats.playerName,
								value: playerStats.totalCards,
								helper: `${playerStats.yellowCards} yellow · ${playerStats.redCards} red`,
							}))}
						/>
					</div>
					<div className="hidden sm:block">
						<ReportBarChart
							ariaLabel="Most carded players"
							labels={topCardedRows.map((playerStats) => shortName(playerStats.playerName))}
							series={[
								{
									label: "Yellow",
									colour: "#f59e0b",
									values: topCardedRows.map((playerStats) => playerStats.yellowCards),
								},
								{
									label: "Red",
									colour: "#dc2626",
									values: topCardedRows.map((playerStats) => playerStats.redCards),
								},
							]}
						/>
					</div>
				</ReportChartContainer>
			</div>

			<ReportDetails title="Player discipline detail" description="Every player with a recorded yellow or red card.">
			<ReportPanel title="Player discipline" description="Players with yellow or red cards in the selected season.">
				{disciplineRows.length === 0 ? (
					<ReportEmptyState title="No discipline records" message="Cards will appear here once match player stats are recorded." />
				) : (
					<div className="overflow-hidden rounded-2xl border border-slate-200">
						<div className="hidden grid-cols-[1fr_5rem_5rem_5rem] gap-2 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 sm:grid">
							<span>Player</span>
							<span className="text-center">Yellow</span>
							<span className="text-center">Red</span>
							<span className="text-center">Total</span>
						</div>
						<div className="divide-y divide-slate-100 bg-white">
							{disciplineRows.map((playerStats) => (
								<div
									key={playerStats.playerId}
									className="grid grid-cols-[1fr_auto] items-center gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_5rem_5rem_5rem]"
								>
									<Link
										to={`/players/${playerStats.playerId}`}
										className="min-w-0 truncate font-black text-slate-950 hover:text-yepset-700"
									>
										{playerStats.playerName}
									</Link>
									<span className="text-right text-xs font-bold text-slate-500 sm:hidden">{playerStats.yellowCards} yellow · {playerStats.redCards} red</span>
									<span className="hidden text-center font-black text-amber-600 sm:block">{playerStats.yellowCards}</span>
									<span className="hidden text-center font-black text-red-700 sm:block">{playerStats.redCards}</span>
									<span className="hidden text-center font-black text-slate-950 sm:block">{playerStats.totalCards}</span>
								</div>
							))}
						</div>
					</div>
				)}
			</ReportPanel>
			</ReportDetails>
		</div>
	);
}

function shortName(name: string) {
	const [firstName, ...rest] = name.split(" ");
	const lastName = rest.at(-1);

	return lastName ? `${firstName[0]}. ${lastName}` : name;
}
