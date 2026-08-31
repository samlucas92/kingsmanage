import ReportBarChart from "../../components/charts/ReportBarChart";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportLineChart from "../../components/charts/ReportLineChart";
import ReportEmptyState from "../../components/ReportEmptyState";
import ReportAnswerCard from "../../components/ReportAnswerCard";
import ReportDetails from "../../components/ReportDetails";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportPanel from "../../components/ReportPanel";
import ReportLoadState from "../../components/ReportLoadState";
import { useReportsContext } from "../../useReportsContext";
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

			<ReportAnswerCard
				eyebrow="Are players responding?"
				value={`${report?.availablePercentage ?? 0}% available`}
				description={`${report?.totals.available ?? 0} available responses from ${report?.totalResponses ?? 0} player-event responses.`}
				tone="success"
				stats={[
					{ label: "Completed events", value: report?.completedEvents ?? 0 },
					{ label: "Avg available", value: formatAverage(report?.averages.available ?? 0), tone: "success" },
					{ label: "Avg declined", value: formatAverage(report?.averages.declined ?? 0), tone: "warning" },
					{ label: "Avg responses", value: formatAverage(averageResponses) },
				]}
			/>

			<div>
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

			<ReportDetails title="Availability trend" description="How average responses have changed month by month.">
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
			</ReportDetails>

			<ReportPanel title="Event type breakdown" description="Average responses per completed event. Hover values to see raw totals.">
				{!report || report.completedEvents === 0 ? (
					<ReportEmptyState title="No completed events" message="Availability reports will appear once completed events have responses." />
				) : (
					<div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
						{eventTypes.map((type) => {
							const breakdown = getEventTypeBreakdown(report, type);

							return (
								<div key={type} className="px-4 py-3 text-sm">
									<div className="flex items-center justify-between gap-3"><span className="font-black text-slate-950">{type}</span><span className="text-xs font-bold text-slate-500">{breakdown.completedEvents} events</span></div>
									<div className="mt-3 grid grid-cols-3 gap-2 text-center">
										<ResponseStat label="Available" value={formatAverage(breakdown.averages.available)} tone="success" />
										<ResponseStat label="Declined" value={formatAverage(breakdown.averages.declined)} tone="warning" />
										<ResponseStat label="No reply" value={formatAverage(breakdown.averages.unanswered)} tone="danger" />
									</div>
								</div>
							);
						})}
					</div>
				)}
			</ReportPanel>
		</div>
	);
}

function ResponseStat({ label, value, tone }: { label: string; value: string; tone: "success" | "warning" | "danger" }) {
	const colour = tone === "success" ? "text-yepset-700" : tone === "warning" ? "text-amber-600" : "text-red-700";
	return <div className="rounded-lg bg-slate-50 px-2 py-2"><p className={`font-black ${colour}`}>{value}</p><p className="text-[10px] font-bold text-slate-500">{label}</p></div>;
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
