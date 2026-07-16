import { Link } from "react-router-dom";
import ReportMetricCard from "../../components/ReportMetricCard";
import ReportPanel from "../../components/ReportPanel";
import ReportEmptyState from "../../components/ReportEmptyState";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportLineChart from "../../components/charts/ReportLineChart";
import { useReportsContext } from "../../ReportsContext";
import { useMatchStore } from "../../../../stores/match";
import { usePlayerStore } from "../../../../stores/players";
import { useSeasonStore } from "../../../../stores/seasons";
import { useStatsStore } from "../../../../stores/stats";
import { useEventStore } from "../../../../stores/events";
import { formatCurrency } from "../../../../utils/format";
import {
	getActivePlayerCount,
	getAvailabilitySummary,
	getCompletedReportMatches,
	getFinanceReportSummary,
	getMonthlyResultBreakdown,
	getRecentForm,
	getResultBreakdown,
	getTopPlayers,
} from "../../utils/reportCalculations";

export default function OverviewReport() {
	const {
		selectedSeasonId,
		selectedTeamId,
		selectedCompetition,
		selectedVenue,
		dateFrom,
		dateTo,
		canViewFinance,
		financeSummary,
		isLoading,
		loadError,
	} = useReportsContext();
	const matches = useMatchStore((state) => state.matches);
	const players = usePlayerStore((state) => state.players);
	const events = useEventStore((state) => state.events);
	const seasons = useSeasonStore((state) => state.seasons);
	const seasonStats = useStatsStore((state) => state.seasonStats);

	const selectedSeason = seasons.find((season) => season.id === selectedSeasonId);
	const completedMatches = getCompletedReportMatches(matches, selectedSeasonId, selectedTeamId, {
		competition: selectedCompetition,
		venue: selectedVenue,
		dateFrom,
		dateTo,
	});
	const summary = getResultBreakdown(completedMatches);
	const recentForm = getRecentForm(completedMatches);
	const monthlyBreakdown = getMonthlyResultBreakdown(completedMatches);
	const topPlayers = getTopPlayers(seasonStats);
	const financeReportSummary = getFinanceReportSummary(financeSummary);
	const availabilitySummary = getAvailabilitySummary({
		events,
		seasonStartDate: selectedSeason?.startDate,
		seasonEndDate: selectedSeason?.endDate,
	});

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Overview"
				description="Key summary for the selected filters."
				showCompetitionFilter
				showVenueFilter
			/>

			{loadError && <ErrorBanner message={loadError} />}
			{isLoading && <LoadingBanner />}

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<ReportMetricCard label="Matches played" value={summary.played} />
				<ReportMetricCard label="Wins" value={summary.won} tone="success" helper={`${summary.winPercentage}% win rate`} />
				<ReportMetricCard label="Goal difference" value={formatSigned(summary.goalDifference)} tone={summary.goalDifference >= 0 ? "success" : "danger"} />
				<ReportMetricCard label="Active players" value={getActivePlayerCount(players)} />
				<ReportMetricCard label="Goals for" value={summary.goalsFor} />
				<ReportMetricCard label="Goals against" value={summary.goalsAgainst} />
				<ReportMetricCard label="Availability" value={`${availabilitySummary.availablePercentage}%`} helper={`${availabilitySummary.available}/${availabilitySummary.totalResponses} available responses`} />
				{canViewFinance && financeReportSummary && (
					<ReportMetricCard
						label="Outstanding finance"
						value={formatCurrency(financeReportSummary.outstanding)}
						tone={financeReportSummary.outstanding > 0 ? "danger" : "success"}
						helper={`${financeReportSummary.playersOwing} players owing`}
					/>
				)}
			</div>

			<div className="grid gap-5 xl:grid-cols-[1fr_.8fr]">
				<ReportPanel title="Recent form" description="Latest completed matches in the selected season.">
					{recentForm.length === 0 ? (
						<ReportEmptyState title="No completed matches" message="Completed match results will appear here." />
					) : (
						<div className="flex flex-wrap gap-2">
							{recentForm.map((result, index) => (
								<span
									key={`${result}-${index}`}
									className={`grid h-10 w-10 place-items-center rounded-full text-sm font-black text-white ${getFormClass(result)}`}
								>
									{result}
								</span>
							))}
						</div>
					)}
				</ReportPanel>

				<ReportPanel title="Leading players" description="Top contributors from existing player stats.">
					{topPlayers.contributions.length === 0 ? (
						<ReportEmptyState title="No player stats" message="Player rankings will appear after match stats are recorded." />
					) : (
						<div className="divide-y divide-slate-100">
							{topPlayers.contributions.map((player) => (
								<div key={player.playerId} className="flex items-center justify-between py-3 text-sm">
									<Link to={`/players/${player.playerId}`} className="font-black text-slate-900 hover:text-yepset-700">
										{player.playerName}
									</Link>
									<span className="font-black text-yepset-700">{player.contributions}</span>
								</div>
							))}
						</div>
					)}
				</ReportPanel>
			</div>

			<ReportChartContainer
				title="Goals trend"
				description="Goals for versus goals against by month."
				isEmpty={monthlyBreakdown.length === 0}
			>
				<ReportLineChart
					ariaLabel="Goals for versus goals against by month"
					labels={monthlyBreakdown.map((month) => month.label)}
					series={[
						{
							label: "Goals For",
							colour: "#147764",
							values: monthlyBreakdown.map((month) => month.goalsFor),
						},
						{
							label: "Goals Against",
							colour: "#dc2626",
							values: monthlyBreakdown.map((month) => month.goalsAgainst),
						},
					]}
				/>
			</ReportChartContainer>
		</div>
	);
}

function LoadingBanner() {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500">
			Loading report data...
		</div>
	);
}

function ErrorBanner({ message }: { message: string }) {
	return (
		<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
			{message}
		</div>
	);
}

function getFormClass(result: "W" | "D" | "L") {
	if (result === "W") {
		return "bg-yepset-600";
	}

	return result === "D" ? "bg-amber-500" : "bg-red-600";
}

function formatSigned(value: number) {
	return value > 0 ? `+${value}` : value;
}
