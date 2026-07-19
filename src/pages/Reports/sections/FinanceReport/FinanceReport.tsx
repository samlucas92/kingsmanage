import ReportBarChart from "../../components/charts/ReportBarChart";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportDoughnutChart from "../../components/charts/ReportDoughnutChart";
import ReportEmptyState from "../../components/ReportEmptyState";
import ReportMetricCard from "../../components/ReportMetricCard";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportPanel from "../../components/ReportPanel";
import ReportLoadState from "../../components/ReportLoadState";
import { useReportsContext } from "../../ReportsContext";
import { useReportResource } from "../../hooks/useReportResource";
import { reportsApi, type FinanceReportResponse } from "../../../../services/reportsApi";
import { formatCurrency } from "../../../../utils/format";

export default function FinanceReport() {
	const { selectedSeasonId, isLoading, loadError } = useReportsContext();
	const { report, isLoadingReport, reportError } = useReportResource<FinanceReportResponse>({
		canLoad: Boolean(selectedSeasonId),
		errorMessage: "Failed to load finance report.",
		dependencies: [selectedSeasonId],
		load: () => reportsApi.getFinanceReport(selectedSeasonId),
	});

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Finance"
				description="Collections, outstanding totals and season-end projection."
				showTeamFilter={false}
				showFriendliesFilter={false}
			/>

			<ReportLoadState
				error={loadError || reportError}
				isLoading={isLoading || isLoadingReport}
			/>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
				<ReportMetricCard label="Expected" value={formatCurrency(report?.expected ?? 0)} />
				<ReportMetricCard label="Collected" value={formatCurrency(report?.collected ?? 0)} tone="success" helper={`${report?.paidPercentage ?? 0}% collected`} />
				<ReportMetricCard
					label="Adjustments"
					value={formatCurrency(report?.adjustments ?? 0)}
					tone={(report?.adjustments ?? 0) < 0 ? "warning" : "default"}
					helper="Separate from payments"
				/>
				<ReportMetricCard label="Outstanding" value={formatCurrency(report?.outstanding ?? 0)} tone={(report?.outstanding ?? 0) > 0 ? "danger" : "success"} />
				<ReportMetricCard
					label="Forecast status"
					value={report?.forecastStatus ?? "—"}
					tone={getForecastTone(report?.forecastStatus)}
					helper={`${report?.daysRemaining ?? 0} days remaining`}
				/>
			</div>

			<div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
				<ReportChartContainer
					title="Collection progress"
					description="Collected versus outstanding for this season."
					isEmpty={!report || report.expected === 0}
				>
					<ReportDoughnutChart
						ariaLabel="Finance collected versus outstanding"
						centerValue={`${report?.paidPercentage ?? 0}%`}
						centerLabel="collected"
						segments={[
							{ label: "Collected", value: report?.collected ?? 0, colour: "#147764" },
							{ label: "Outstanding", value: report?.outstanding ?? 0, colour: "#dc2626" },
						]}
					/>
				</ReportChartContainer>

				<ReportChartContainer
					title="Collections over time"
					description="Payments received by month, with charges and adjustments shown separately."
					isEmpty={!report || report.months.length === 0}
				>
					<ReportBarChart
						ariaLabel="Finance payments charges and adjustments by month"
						labels={report?.months.map((item) => item.label) ?? []}
						series={[
							{
								label: "Payments",
								colour: "#147764",
								values: report?.months.map((item) => item.collected) ?? [],
							},
							{
								label: "Charged",
								colour: "#2563eb",
								values: report?.months.map((item) => item.charged) ?? [],
							},
							{
								label: "Adjustments",
								colour: "#f59e0b",
								values: report?.months.map((item) => item.adjustments) ?? [],
							},
						]}
					/>
				</ReportChartContainer>
			</div>

			<div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
				<ReportChartContainer
					title="Forecast scenarios"
					description="Projected season-end collection based on different payment paces."
					isEmpty={!report || report.forecastScenarios.length === 0}
				>
					<ReportBarChart
						ariaLabel="Finance forecast scenarios"
						labels={report?.forecastScenarios.map((scenario) => scenario.label) ?? []}
						series={[
							{
								label: "Projected collected",
								colour: "#147764",
								values: report?.forecastScenarios.map((scenario) => scenario.projectedCollected) ?? [],
							},
							{
								label: "Projected shortfall",
								colour: "#dc2626",
								values: report?.forecastScenarios.map((scenario) => scenario.projectedShortfall) ?? [],
							},
						]}
					/>
				</ReportChartContainer>

				<ReportPanel title="Collection pace" description="Recent payment velocity compared with what is needed.">
					<div className="grid gap-3">
						<ProjectionCard
							label="Season daily pace"
							value={formatCurrency(report?.dailyPace ?? 0)}
							helper={`${report?.elapsedPercentage ?? 0}% of season elapsed`}
						/>
						<ProjectionCard
							label="Last 30 days"
							value={formatCurrency(report?.last30DaysPace ?? 0)}
							helper={`${formatCurrency(report?.last30DaysCollected ?? 0)} collected`}
						/>
						<ProjectionCard
							label="Required daily pace"
							value={formatCurrency(report?.requiredDailyPace ?? 0)}
							tone={(report?.dailyPace ?? 0) >= (report?.requiredDailyPace ?? 0) ? "success" : "danger"}
							helper="Needed to clear outstanding"
						/>
					</div>
				</ReportPanel>
			</div>

			<ReportPanel title="Scenario detail" description="Forecasts use payment transactions already recorded against this season.">
				<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
					{(report?.forecastScenarios ?? []).map((scenario) => (
						<ProjectionCard
							key={scenario.label}
							label={scenario.label}
							value={formatCurrency(scenario.projectedCollected)}
							tone={scenario.projectedShortfall > 0 ? "danger" : "success"}
							helper={`${scenario.completionPercentage}% collected · ${formatCurrency(scenario.projectedShortfall)} short`}
							description={scenario.description}
						/>
					))}
				</div>
			</ReportPanel>

			<ReportPanel title="Finance report notes" description="Operational payment management stays in the Finance area.">
				{!report || report.expected === 0 ? (
					<ReportEmptyState title="No finance target" message="Set season finance amounts before projections can be useful." />
				) : (
					<div className="space-y-2 text-sm font-semibold text-slate-600">
						<p>
							This report shows expected collection, received payments, outstanding amount and projected season-end collection.
						</p>
						<p>
							It intentionally does not include bulk updates, payment entry or player-by-player chasing controls.
						</p>
					</div>
				)}
			</ReportPanel>
		</div>
	);
}

function ProjectionCard({
	label,
	value,
	helper,
	description,
	tone = "default",
}: {
	label: string;
	value: string;
	helper?: string;
	description?: string;
	tone?: "default" | "success" | "danger";
}) {
	const valueClass =
		tone === "success"
			? "text-yepset-700"
			: tone === "danger"
				? "text-red-700"
				: "text-slate-950";

	return (
		<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
			<p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
			<p className={`mt-2 text-xl font-black ${valueClass}`}>{value}</p>
			{helper && <p className="mt-1 text-xs font-bold text-slate-500">{helper}</p>}
			{description && <p className="mt-3 text-xs font-semibold leading-relaxed text-slate-500">{description}</p>}
		</div>
	);
}

function getForecastTone(status?: string) {
	if (status === "On target" || status === "On pace") {
		return "success";
	}

	if (status === "Behind pace") {
		return "danger";
	}

	return status === "Needs attention" ? "warning" : "default";
}
