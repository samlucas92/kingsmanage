import ReportBarChart from "../../components/charts/ReportBarChart";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportAnswerCard from "../../components/ReportAnswerCard";
import ReportDetails from "../../components/ReportDetails";
import ReportEmptyState from "../../components/ReportEmptyState";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportLoadState from "../../components/ReportLoadState";
import { useReportsContext } from "../../ReportsContext";
import { useReportResource } from "../../hooks/useReportResource";
import { reportsApi, type AvailabilityReportResponse } from "../../../../services/reportsApi";

export default function TrainingDevelopmentReport() {
	const { selectedSeasonId, loadError, isLoading } = useReportsContext();
	const { report, isLoadingReport, reportError } = useReportResource<AvailabilityReportResponse>({
		canLoad: Boolean(selectedSeasonId),
		errorMessage: "Failed to load training report.",
		dependencies: [selectedSeasonId],
		load: () =>
			reportsApi.getAvailabilityReport({
				seasonId: selectedSeasonId,
				eventType: "Training",
			}),
	});
	const averageResponses = report
		? report.averages.available + report.averages.declined + report.averages.unanswered
		: 0;

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Training and Development"
				description="Foundation for training insight and player development."
				showTeamFilter={false}
				showFriendliesFilter={false}
			/>

			<ReportLoadState
				error={loadError || reportError}
				isLoading={isLoading || isLoadingReport}
			/>

			<ReportAnswerCard
				eyebrow="Training availability"
				value={`${formatAverage(report?.averages.available ?? 0)} players available`}
				description="Average availability per completed training session. This currently measures responses, not confirmed attendance."
				tone="success"
				stats={[
					{ label: "Completed sessions", value: report?.completedEvents ?? 0 },
					{ label: "Avg declined", value: formatAverage(report?.averages.declined ?? 0), tone: "warning" },
					{ label: "Avg unanswered", value: formatAverage(report?.averages.unanswered ?? 0), tone: "danger" },
					{ label: "Avg responses", value: formatAverage(averageResponses) },
				]}
			/>

			<div>
				<ReportChartContainer
					title="Training responses by month"
					description="Average responses per completed training session each month."
					isEmpty={!report || report.months.length === 0}
				>
					<ReportBarChart
						ariaLabel="Average training availability responses by month"
						labels={report?.months.map((month) => month.label) ?? []}
						tickPrecision={1}
						series={[
							{
								label: "Available",
								colour: "#147764",
								values: report?.months.map((month) => month.averages.available) ?? [],
							},
							{
								label: "Declined",
								colour: "#f59e0b",
								values: report?.months.map((month) => month.averages.declined) ?? [],
							},
							{
								label: "Unanswered",
								colour: "#dc2626",
								values: report?.months.map((month) => month.averages.unanswered) ?? [],
							},
						]}
					/>
				</ReportChartContainer>
			</div>

			<ReportDetails title="What this report can tell you" description="Current data coverage and the next development step.">
				<div className="space-y-3 text-sm font-semibold text-slate-600">
					<p>
						Current reliable data covers training event availability responses. The app does not yet record actual attendance,
						training themes, player development reviews or private coach notes.
					</p>
					<p>
						Next phase should add historical player development reviews and training session feedback before showing player
						development trends or recommendations.
					</p>
				</div>
			</ReportDetails>

			{(!report || report.completedEvents === 0) && (
				<ReportEmptyState
					title="No completed training events"
					message="Completed training events will power the first useful development summaries."
				/>
			)}
		</div>
	);
}

function formatAverage(value: number) {
	return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
