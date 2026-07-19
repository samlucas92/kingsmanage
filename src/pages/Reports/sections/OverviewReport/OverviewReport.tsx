import { Link } from "react-router-dom";
import ReportMetricCard from "../../components/ReportMetricCard";
import ReportPanel from "../../components/ReportPanel";
import ReportEmptyState from "../../components/ReportEmptyState";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportLineChart from "../../components/charts/ReportLineChart";
import ReportLoadState from "../../components/ReportLoadState";
import { useReportsContext } from "../../ReportsContext";
import { useReportResource } from "../../hooks/useReportResource";
import { reportsApi, type OverviewReportResponse } from "../../../../services/reportsApi";

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
	const { report, isLoadingReport, reportError } = useReportResource<OverviewReportResponse>({
		canLoad: Boolean(selectedSeasonId),
		errorMessage: "Failed to load overview report.",
		dependencies: [dateFrom, dateTo, selectedCompetition, selectedSeasonId, selectedTeamId, selectedVenue],
		load: () =>
			reportsApi.getOverviewReport({
				seasonId: selectedSeasonId,
				teamId: selectedTeamId,
				competition: selectedCompetition,
				venue: selectedVenue,
				dateFrom,
				dateTo,
			}),
	});
	const summary = report?.teamPerformance.summary;
	const recentForm = report?.teamPerformance.recentForm ?? [];
	const monthlyBreakdown = report?.teamPerformance.months ?? [];
	const topPlayers = report?.topContributors ?? [];
	const availabilitySummary = report?.availability;

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Overview"
				description="Key summary for the selected filters."
				showCompetitionFilter
				showVenueFilter
			/>

			<ReportLoadState
				error={loadError || reportError}
				isLoading={isLoading || isLoadingReport}
			/>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<ReportMetricCard label="Matches played" value={summary?.played ?? 0} />
				<ReportMetricCard label="Wins" value={summary?.won ?? 0} tone="success" helper={`${summary?.winPercentage ?? 0}% win rate`} />
				<ReportMetricCard label="Goal difference" value={formatSigned(summary?.goalDifference ?? 0)} tone={(summary?.goalDifference ?? 0) >= 0 ? "success" : "danger"} />
				<ReportMetricCard label="Active players" value={report?.activePlayers ?? 0} />
				<ReportMetricCard label="Goals for" value={summary?.goalsFor ?? 0} />
				<ReportMetricCard label="Goals against" value={summary?.goalsAgainst ?? 0} />
				<ReportMetricCard label="Availability" value={`${availabilitySummary?.availablePercentage ?? 0}%`} helper={`${availabilitySummary?.totals.available ?? 0}/${availabilitySummary?.totalResponses ?? 0} available responses`} />
				{canViewFinance && financeSummary && (
					<ReportMetricCard label="Outstanding finance" value="Open finance report" helper="Finance is loaded from the finance report API" />
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
					{topPlayers.length === 0 ? (
						<ReportEmptyState title="No player stats" message="Player rankings will appear after match stats are recorded." />
					) : (
						<div className="divide-y divide-slate-100">
							{topPlayers.map((player) => (
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

function getFormClass(result: "W" | "D" | "L") {
	if (result === "W") {
		return "bg-yepset-600";
	}

	return result === "D" ? "bg-amber-500" : "bg-red-600";
}

function formatSigned(value: number) {
	return value > 0 ? `+${value}` : value;
}
