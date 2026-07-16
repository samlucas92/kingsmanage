import { useEffect, useState } from "react";
import ReportMetricCard from "../../components/ReportMetricCard";
import ReportPanel from "../../components/ReportPanel";
import ReportEmptyState from "../../components/ReportEmptyState";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportBarChart from "../../components/charts/ReportBarChart";
import ReportLineChart from "../../components/charts/ReportLineChart";
import { useReportsContext } from "../../ReportsContext";
import {
	reportsApi,
	type ResultBreakdown,
	type TeamPerformanceReportResponse,
} from "../../../../services/reportsApi";

const emptySummary: ResultBreakdown = {
	played: 0,
	won: 0,
	drawn: 0,
	lost: 0,
	goalsFor: 0,
	goalsAgainst: 0,
	goalDifference: 0,
	winPercentage: 0,
	averageGoalsFor: 0,
	averageGoalsAgainst: 0,
};

export default function TeamPerformanceReport() {
	const {
		selectedSeasonId,
		selectedTeamId,
		selectedCompetition,
		selectedVenue,
		dateFrom,
		dateTo,
		isLoading,
		loadError,
	} = useReportsContext();
	const [report, setReport] = useState<TeamPerformanceReportResponse | null>(null);
	const [isLoadingReport, setIsLoadingReport] = useState(false);
	const [reportError, setReportError] = useState("");
	const summary = report?.summary ?? emptySummary;
	const homeAway = report?.homeAway ?? { home: emptySummary, away: emptySummary };
	const monthlyBreakdown = report?.months ?? [];
	const recentForm = report?.recentForm ?? [];

	useEffect(() => {
		if (!selectedSeasonId) {
			setReport(null);
			return;
		}

		let isCurrent = true;

		setIsLoadingReport(true);
		setReportError("");

		reportsApi.getTeamPerformanceReport({
			seasonId: selectedSeasonId,
			teamId: selectedTeamId,
			competition: selectedCompetition,
			venue: selectedVenue,
			dateFrom,
			dateTo,
		})
			.then((response) => {
				if (isCurrent) {
					setReport(response);
				}
			})
			.catch((error) => {
				if (isCurrent) {
					setReportError(error instanceof Error ? error.message : "Failed to load team performance report.");
					setReport(null);
				}
			})
			.finally(() => {
				if (isCurrent) {
					setIsLoadingReport(false);
				}
			});

		return () => {
			isCurrent = false;
		};
	}, [dateFrom, dateTo, selectedCompetition, selectedSeasonId, selectedTeamId, selectedVenue]);

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Team Performance"
				description="Results and performance breakdown."
				showCompetitionFilter
				showVenueFilter
			/>

			{(loadError || reportError) && (
				<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
					{loadError || reportError}
				</div>
			)}
			{(isLoading || isLoadingReport) && (
				<div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500">
					Loading report data...
				</div>
			)}

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<ReportMetricCard label="Played" value={summary.played} />
				<ReportMetricCard label="Won" value={summary.won} tone="success" />
				<ReportMetricCard label="Win %" value={`${summary.winPercentage}%`} tone="success" />
				<ReportMetricCard label="GD" value={formatSigned(summary.goalDifference)} tone={summary.goalDifference >= 0 ? "success" : "danger"} />
			</div>

			<div className="grid gap-5 xl:grid-cols-2">
				<ReportChartContainer
					title="Results over time"
					description="Wins, draws and losses by month."
					isEmpty={monthlyBreakdown.length === 0}
				>
					<ReportBarChart
						ariaLabel="Wins draws and losses by month"
						labels={monthlyBreakdown.map((month) => month.label)}
						series={[
							{ label: "Wins", colour: "#147764", values: monthlyBreakdown.map((month) => month.wins) },
							{ label: "Draws", colour: "#f59e0b", values: monthlyBreakdown.map((month) => month.draws) },
							{ label: "Losses", colour: "#dc2626", values: monthlyBreakdown.map((month) => month.losses) },
						]}
					/>
				</ReportChartContainer>

				<ReportChartContainer
					title="Goals for vs goals against"
					description="Monthly scoring and concession trend."
					isEmpty={monthlyBreakdown.length === 0}
				>
					<ReportLineChart
						ariaLabel="Goals for versus goals against by month"
						labels={monthlyBreakdown.map((month) => month.label)}
						series={[
							{ label: "Goals For", colour: "#147764", values: monthlyBreakdown.map((month) => month.goalsFor) },
							{ label: "Goals Against", colour: "#dc2626", values: monthlyBreakdown.map((month) => month.goalsAgainst) },
						]}
					/>
				</ReportChartContainer>
			</div>

			<div className="grid gap-5 xl:grid-cols-2">
				<ReportPanel title="Home vs away">
					<div className="grid gap-3 sm:grid-cols-2">
						<RecordCard label="Home" summary={homeAway.home} />
						<RecordCard label="Away" summary={homeAway.away} />
					</div>
				</ReportPanel>

				<ReportPanel title="Form" description="Last 10 completed matches.">
					{recentForm.length === 0 ? (
						<ReportEmptyState title="No completed matches" message="Form will appear after completed results." />
					) : (
						<div className="flex flex-wrap gap-2">
							{recentForm.map((result, index) => (
								<span
									key={`${result}-${index}`}
									className={`grid h-9 w-9 place-items-center rounded-full text-sm font-black text-white ${getFormClass(result)}`}
								>
									{result}
								</span>
							))}
						</div>
					)}
				</ReportPanel>
			</div>
		</div>
	);
}

function RecordCard({
	label,
	summary,
}: {
	label: string;
	summary: ResultBreakdown;
}) {
	return (
		<div className="rounded-2xl border border-yepset-100 bg-yepset-50/60 p-4 text-center">
			<p className="text-sm font-black text-yepset-800">{label}</p>
			<div className="mt-3 grid grid-cols-2 gap-3 text-xs font-bold text-slate-500">
				<div><p className="text-xl font-black text-slate-950">{summary.played}</p>Played</div>
				<div><p className="text-xl font-black text-slate-950">{summary.won}</p>Won</div>
				<div><p className="text-xl font-black text-slate-950">{summary.drawn}</p>Drawn</div>
				<div><p className="text-xl font-black text-slate-950">{summary.lost}</p>Lost</div>
			</div>
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
