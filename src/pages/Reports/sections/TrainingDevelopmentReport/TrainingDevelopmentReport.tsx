import { useEffect, useState } from "react";
import ReportBarChart from "../../components/charts/ReportBarChart";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportDoughnutChart from "../../components/charts/ReportDoughnutChart";
import ReportMetricCard from "../../components/ReportMetricCard";
import ReportPanel from "../../components/ReportPanel";
import ReportEmptyState from "../../components/ReportEmptyState";
import ReportPageHeader from "../../components/ReportPageHeader";
import { useReportsContext } from "../../ReportsContext";
import { reportsApi, type AvailabilityReportResponse } from "../../../../services/reportsApi";

export default function TrainingDevelopmentReport() {
	const { selectedSeasonId, loadError, isLoading } = useReportsContext();
	const [report, setReport] = useState<AvailabilityReportResponse | null>(null);
	const [isLoadingReport, setIsLoadingReport] = useState(false);
	const [reportError, setReportError] = useState("");

	useEffect(() => {
		if (!selectedSeasonId) {
			setReport(null);
			return;
		}

		let isCurrent = true;

		setIsLoadingReport(true);
		setReportError("");

		reportsApi.getAvailabilityReport({
			seasonId: selectedSeasonId,
			eventType: "Training",
		})
			.then((response) => {
				if (isCurrent) {
					setReport(response);
				}
			})
			.catch((error) => {
				if (isCurrent) {
					setReportError(error instanceof Error ? error.message : "Failed to load training report.");
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
	}, [selectedSeasonId]);

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Training and Development"
				description="Foundation for training insight and player development."
				showTeamFilter={false}
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
				<ReportMetricCard label="Completed training" value={report?.completedEvents ?? 0} />
				<ReportMetricCard label="Available responses" value={`${report?.availablePercentage ?? 0}%`} helper={`${report?.totals.available ?? 0}/${report?.totalResponses ?? 0} available`} />
				<ReportMetricCard label="Declined" value={report?.totals.declined ?? 0} tone={(report?.totals.declined ?? 0) > 0 ? "warning" : "default"} />
				<ReportMetricCard label="No response" value={report?.totals.unanswered ?? 0} tone={(report?.totals.unanswered ?? 0) > 0 ? "danger" : "default"} />
			</div>

			<div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
				<ReportChartContainer
					title="Training availability mix"
					description="Average available, declined and unanswered responses per completed training session."
					isEmpty={!report || report.totalResponses === 0}
				>
					<ReportDoughnutChart
						ariaLabel="Average training availability response mix"
						centerValue={formatAverage(report?.averages.available ?? 0)}
						centerLabel="avg available"
						segments={[
							{ label: "Available", value: report?.averages.available ?? 0, colour: "#147764" },
							{ label: "Declined", value: report?.averages.declined ?? 0, colour: "#f59e0b" },
							{ label: "Unanswered", value: report?.averages.unanswered ?? 0, colour: "#dc2626" },
						]}
					/>
				</ReportChartContainer>

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

			<ReportPanel title="Development model coming next" description="This area is deliberately honest until the development data model exists.">
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
			</ReportPanel>

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
