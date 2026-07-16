import { Link } from "react-router-dom";
import ReportDoughnutChart from "../../components/charts/ReportDoughnutChart";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportEmptyState from "../../components/ReportEmptyState";
import ReportMetricCard from "../../components/ReportMetricCard";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportPanel from "../../components/ReportPanel";
import { useReportsContext } from "../../ReportsContext";
import { useStatsStore } from "../../../../stores/stats";

export default function DisciplineReport() {
	const { selectedPlayerId, isLoading, loadError } = useReportsContext();
	const seasonStats = useStatsStore((state) => state.seasonStats);
	const filteredSeasonStats = seasonStats.filter((playerStats) =>
		selectedPlayerId === "all" || playerStats.playerId === selectedPlayerId
	);
	const disciplineRows = filteredSeasonStats
		.map((playerStats) => ({
			...playerStats,
			totalCards: playerStats.yellowCards + playerStats.redCards,
		}))
		.filter((playerStats) => playerStats.totalCards > 0)
		.sort((firstPlayer, secondPlayer) =>
			secondPlayer.totalCards - firstPlayer.totalCards ||
			secondPlayer.redCards - firstPlayer.redCards ||
			firstPlayer.playerName.localeCompare(secondPlayer.playerName)
		);
	const yellowCards = filteredSeasonStats.reduce((total, playerStats) => total + playerStats.yellowCards, 0);
	const redCards = filteredSeasonStats.reduce((total, playerStats) => total + playerStats.redCards, 0);
	const mostCardedPlayer = disciplineRows[0];

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Discipline"
				description="Cards and sanctions from recorded match player stats."
				showTeamFilter={false}
				showPlayerFilter
			/>

			{loadError && (
				<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
					{loadError}
				</div>
			)}
			{isLoading && (
				<div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500">
					Loading report data...
				</div>
			)}

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
