import ReportBarChart from "../../components/charts/ReportBarChart";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportDoughnutChart from "../../components/charts/ReportDoughnutChart";
import ReportLineChart from "../../components/charts/ReportLineChart";
import ReportEmptyState from "../../components/ReportEmptyState";
import ReportMetricCard from "../../components/ReportMetricCard";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportPanel from "../../components/ReportPanel";
import ReportLoadState from "../../components/ReportLoadState";
import { useReportsContext } from "../../ReportsContext";
import { useReportResource } from "../../hooks/useReportResource";
import type { ClubEventType } from "../../../../types/events";
import { reportsApi, type AvailabilityReportResponse } from "../../../../services/reportsApi";

const eventTypes: ClubEventType[] = ["Match", "Training", "Social", "Meeting"];

export default function AvailabilityReport() {
	const { selectedSeasonId, isLoading, loadError } = useReportsContext();
	const { report, isLoadingReport, reportError } = useReportResource<AvailabilityReportResponse>({
		canLoad: Boolean(selectedSeasonId),
		errorMessage: "Failed to load availability report.",
		dependencies: [selectedSeasonId],
		load: () => reportsApi.getAvailabilityReport({ seasonId: selectedSeasonId }),
	});
	const averageResponses = report
		? report.averages.available + report.averages.declined + report.averages.unanswered
		: 0;

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Availability"
				description="Event response insight from completed events."
				showTeamFilter={false}
				showFriendliesFilter={false}
			/>

			<ReportLoadState
				error={loadError || reportError}
				isLoading={isLoading || isLoadingReport}
			/>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<ReportMetricCard label="Completed events" value={report?.completedEvents ?? 0} />
				<ReportMetricCard label="Avg available" value={formatAverage(report?.averages.available ?? 0)} tone="success" helper="Per completed event" />
				<ReportMetricCard label="Avg declined" value={formatAverage(report?.averages.declined ?? 0)} tone={(report?.averages.declined ?? 0) > 0 ? "warning" : "default"} helper="Per completed event" />
				<ReportMetricCard label="Avg responses" value={formatAverage(averageResponses)} helper="Per completed event" />
			</div>

			<div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
				<ReportChartContainer
					title="Average response mix"
					description="Average available, declined and unanswered responses per completed event."
					isEmpty={!report || report.totalResponses === 0}
				>
					<ReportDoughnutChart
						ariaLabel="Average availability response mix per completed event"
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
					title="Average availability responses"
					description="Average responses per completed event, grouped by event type."
					isEmpty={!report || report.completedEvents === 0}
				>
					<ReportBarChart
						ariaLabel="Average availability responses by event type"
						labels={eventTypes}
						tickPrecision={1}
						series={[
							{
								label: "Available",
								colour: "#147764",
								values: eventTypes.map((type) => getEventTypeBreakdown(report, type).averages.available),
							},
							{
								label: "Declined",
								colour: "#f59e0b",
								values: eventTypes.map((type) => getEventTypeBreakdown(report, type).averages.declined),
							},
							{
								label: "Unanswered",
								colour: "#dc2626",
								values: eventTypes.map((type) => getEventTypeBreakdown(report, type).averages.unanswered),
							},
						]}
					/>
				</ReportChartContainer>
			</div>

			<ReportChartContainer
				title="Availability trend"
				description="Average available, declined and unanswered responses by month."
				isEmpty={!report || report.months.length === 0}
			>
				<ReportLineChart
					ariaLabel="Average availability response trend by month"
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

			<ReportPanel title="Event type breakdown" description="Average responses per completed event. Hover values to see raw totals.">
				{!report || report.completedEvents === 0 ? (
					<ReportEmptyState title="No completed events" message="Availability reports will appear once completed events have responses." />
				) : (
					<div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
						{eventTypes.map((type) => {
							const breakdown = getEventTypeBreakdown(report, type);

							return (
								<div key={type} className="grid grid-cols-[1fr_repeat(4,4.5rem)] items-center gap-2 px-4 py-3 text-sm">
									<span className="font-black text-slate-950">{type}</span>
									<span className="text-center font-bold text-slate-500">{breakdown.completedEvents} events</span>
									<span className="text-center font-black text-yepset-700" title={`${breakdown.totals.available} total available`}>
										{formatAverage(breakdown.averages.available)}
									</span>
									<span className="text-center font-black text-amber-600" title={`${breakdown.totals.declined} total declined`}>
										{formatAverage(breakdown.averages.declined)}
									</span>
									<span className="text-center font-black text-red-700" title={`${breakdown.totals.unanswered} total unanswered`}>
										{formatAverage(breakdown.averages.unanswered)}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</ReportPanel>
		</div>
	);
}

function formatAverage(value: number) {
	return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getEventTypeBreakdown(
	report: AvailabilityReportResponse | null,
	type: ClubEventType
) {
	return report?.eventTypes.find((item) => item.type === type) ?? {
		type,
		completedEvents: 0,
		totals: { available: 0, declined: 0, unanswered: 0 },
		averages: { available: 0, declined: 0, unanswered: 0 },
	};
}
