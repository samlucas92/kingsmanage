import ReportBarChart from "../../components/charts/ReportBarChart";
import { Link } from "react-router-dom";
import ReportDoughnutChart from "../../components/charts/ReportDoughnutChart";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportEmptyState from "../../components/ReportEmptyState";
import ReportMetricCard from "../../components/ReportMetricCard";
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

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<ReportMetricCard label="Yellow cards" value={yellowCards} tone={yellowCards > 0 ? "warning" : "default"} />
				<ReportMetricCard label="Red cards" value={redCards} tone={redCards > 0 ? "danger" : "default"} />
				<ReportMetricCard label="Total cards" value={yellowCards + redCards} />
				<ReportMetricCard
					label="Most cards"
					value={mostCardedPlayer?.playerName ?? "—"}
					helper={mostCardedPlayer ? `${mostCardedPlayer.totalCards} cards` : "No cards recorded"}
				/>
			</div>

			<div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
				<ReportChartContainer
					title="Card mix"
					description="Yellow versus red card split."
					isEmpty={yellowCards + redCards === 0}
				>
					<ReportDoughnutChart
						ariaLabel="Yellow and red card mix"
						centerValue={yellowCards + redCards}
						centerLabel="cards"
						segments={[
							{ label: "Yellow", value: yellowCards, colour: "#f59e0b" },
							{ label: "Red", value: redCards, colour: "#dc2626" },
						]}
					/>
				</ReportChartContainer>

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

			<ReportPanel title="Player discipline" description="Players with yellow or red cards in the selected season.">
				{disciplineRows.length === 0 ? (
					<ReportEmptyState title="No discipline records" message="Cards will appear here once match player stats are recorded." />
				) : (
					<div className="overflow-hidden rounded-2xl border border-slate-200">
						<div className="grid grid-cols-[1fr_5rem_5rem_5rem] gap-2 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
							<span>Player</span>
							<span className="text-center">Yellow</span>
							<span className="text-center">Red</span>
							<span className="text-center">Total</span>
						</div>
						<div className="divide-y divide-slate-100 bg-white">
							{disciplineRows.map((playerStats) => (
								<div
									key={playerStats.playerId}
									className="grid grid-cols-[1fr_5rem_5rem_5rem] items-center gap-2 px-4 py-3 text-sm"
								>
									<Link
										to={`/players/${playerStats.playerId}`}
										className="min-w-0 truncate font-black text-slate-950 hover:text-yepset-700"
									>
										{playerStats.playerName}
									</Link>
									<span className="text-center font-black text-amber-600">{playerStats.yellowCards}</span>
									<span className="text-center font-black text-red-700">{playerStats.redCards}</span>
									<span className="text-center font-black text-slate-950">{playerStats.totalCards}</span>
								</div>
							))}
						</div>
					</div>
				)}
			</ReportPanel>
		</div>
	);
}

function shortName(name: string) {
	const [firstName, ...rest] = name.split(" ");
	const lastName = rest.at(-1);

	return lastName ? `${firstName[0]}. ${lastName}` : name;
}
