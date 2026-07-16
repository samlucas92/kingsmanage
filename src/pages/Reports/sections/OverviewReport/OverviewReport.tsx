import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ReportMetricCard from "../../components/ReportMetricCard";
import ReportPanel from "../../components/ReportPanel";
import ReportEmptyState from "../../components/ReportEmptyState";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportLineChart from "../../components/charts/ReportLineChart";
import { useReportsContext } from "../../ReportsContext";
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
	const [report, setReport] = useState<OverviewReportResponse | null>(null);
	const [isLoadingReport, setIsLoadingReport] = useState(false);
	const [reportError, setReportError] = useState("");
	const summary = report?.teamPerformance.summary;
	const recentForm = report?.teamPerformance.recentForm ?? [];
	const monthlyBreakdown = report?.teamPerformance.months ?? [];
	const topPlayers = report?.topContributors ?? [];
	const availabilitySummary = report?.availability;

	useEffect(() => {
		if (!selectedSeasonId) {
			setReport(null);
			return;
		}

		let isCurrent = true;
		setIsLoadingReport(true);
		setReportError("");

		reportsApi.getOverviewReport({
			seasonId: selectedSeasonId,
			teamId: selectedTeamId,
			competition: selectedCompetition,
			venue: selectedVenue,
			dateFrom,
			dateTo,
		})
			.then((response) => {
				if (isCurrent) setReport(response);
			})
			.catch((error) => {
				if (isCurrent) {
					setReportError(error instanceof Error ? error.message : "Failed to load overview report.");
					setReport(null);
				}
			})
			.finally(() => {
				if (isCurrent) setIsLoadingReport(false);
			});

		return () => {
			isCurrent = false;
		};
	}, [dateFrom, dateTo, selectedCompetition, selectedSeasonId, selectedTeamId, selectedVenue]);

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Overview"
				description="Key summary for the selected filters."
				showCompetitionFilter
				showVenueFilter
			/>

			{(loadError || reportError) && <ErrorBanner message={loadError || reportError} />}
			{(isLoading || isLoadingReport) && <LoadingBanner />}

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
