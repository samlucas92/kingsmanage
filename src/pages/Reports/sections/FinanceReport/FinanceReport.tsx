import { Link } from "react-router-dom";
import ProgressBar from "../../../../components/compositions/ProgressBar";
import { formatCurrency } from "../../../../utils/format";
import { reportsApi, type FinanceOutstandingGroup, type FinanceReportResponse } from "../../../../services/reportsApi";
import ReportBarChart from "../../components/charts/ReportBarChart";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportEmptyState from "../../components/ReportEmptyState";
import ReportLoadState from "../../components/ReportLoadState";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportPanel from "../../components/ReportPanel";
import { useReportResource } from "../../hooks/useReportResource";
import { useReportsContext } from "../../useReportsContext";

export default function FinanceReport() {
	const { selectedSeasonId, isLoading, loadError } = useReportsContext();
	const { report, isLoadingReport, reportError } = useReportResource<FinanceReportResponse>({
		canLoad: Boolean(selectedSeasonId),
		errorMessage: "Failed to load finance report.",
		dependencies: [selectedSeasonId],
		load: () => reportsApi.getFinanceReport(selectedSeasonId),
	});

	return (
		<div className="space-y-4 sm:space-y-5">
			<ReportPageHeader
				title="Finance insights"
				description="Clear answers about collection progress and pace."
				showTeamFilter={false}
				showFriendliesFilter={false}
			/>

			<ReportLoadState error={loadError || reportError} isLoading={isLoading || isLoadingReport} />

			<ReportPanel title="How are we doing?">
				{!report || report.expected === 0 ? (
					<ReportEmptyState title="No finance target" message="Set season finance amounts before collection insights can be calculated." />
				) : (
					<div>
						<p className="text-3xl font-black tracking-tight text-yepset-700 sm:text-4xl">
							{formatCurrency(report.collected)} <span className="text-xl text-slate-500 sm:text-2xl">of {formatCurrency(report.expected)}</span>
						</p>
						<p className="mt-2 text-sm font-black text-yepset-700">{report.paidPercentage}% collected</p>
						<ProgressBar value={report.collected} max={report.expected} tone="success" heightClassName="h-2.5" className="mt-3" />
						<p className="mt-3 text-sm font-semibold text-slate-600"><strong className="text-slate-950">{formatCurrency(report.outstanding)}</strong> remaining</p>
					</div>
				)}
			</ReportPanel>

			<ReportPanel title="Are we on track?" description="Recent payment pace compared with what is needed from today.">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-black ${getStatusClass(report?.forecastStatus)}`}>
							{report?.forecastStatus ?? "No target"}
						</span>
						{report && report.expected > 0 && (
							<p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-slate-600">
								You are collecting {formatCurrency(Math.abs(report.last30DaysPace - report.requiredDailyPace))} per day {report.last30DaysPace >= report.requiredDailyPace ? "more" : "less"} than the pace needed to clear the outstanding balance.
							</p>
						)}
					</div>
					<div className="grid grid-cols-2 gap-3 sm:min-w-80">
						<PaceMetric label="Last 30 days" value={report?.last30DaysPace ?? 0} helper={`${formatCurrency(report?.last30DaysCollected ?? 0)} collected`} tone="success" />
						<PaceMetric label="Needed from today" value={report?.requiredDailyPace ?? 0} helper={`${report?.daysRemaining ?? 0} days remaining`} />
					</div>
				</div>
			</ReportPanel>

			<div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
				<ReportChartContainer
					title="Money collected by month"
					description="Actual payment transactions received during the season."
					isEmpty={!report || report.months.length === 0}
				>
					<ReportBarChart
						ariaLabel="Finance payments collected by month"
						labels={report?.months.map((item) => item.label) ?? []}
						series={[{ label: "Payments", colour: "#147764", values: report?.months.map((item) => item.collected) ?? [] }]}
					/>
				</ReportChartContainer>

				<ReportPanel title="Where is the outstanding?" description="Open a group to see the relevant players in Finance.">
					<div className="divide-y divide-slate-100">
						<BreakdownRow label="haven't paid anything" filter="unpaid" seasonId={selectedSeasonId} group={report?.outstandingBreakdown?.unpaid} tone="danger" />
						<BreakdownRow label="have partly paid" filter="part-paid" seasonId={selectedSeasonId} group={report?.outstandingBreakdown?.partPaid} tone="warning" />
						<BreakdownRow label="paid in full" filter="paid" seasonId={selectedSeasonId} group={report?.outstandingBreakdown?.paid} tone="success" />
						<BreakdownRow label="have no charge" filter="nothing-owed" seasonId={selectedSeasonId} group={report?.outstandingBreakdown?.noCharge} tone="neutral" />
					</div>
				</ReportPanel>
			</div>

			<details className="rounded-2xl border border-slate-200 bg-white shadow-sm">
				<summary className="cursor-pointer list-none p-4 text-base font-black text-slate-950 sm:p-5">View forecast details</summary>
				<div className="space-y-5 border-t border-slate-100 p-4 sm:p-5">
					<p className="text-sm font-medium text-slate-500">Deeper projections for admins who need them. These use payment transactions already recorded against this season.</p>
					<div className="grid gap-3 sm:grid-cols-3">
						<PaceMetric label="Season daily pace" value={report?.dailyPace ?? 0} helper={`${report?.elapsedPercentage ?? 0}% of season elapsed`} />
						<PaceMetric label="Last 90 days" value={report?.last90DaysPace ?? 0} helper={`${formatCurrency(report?.last90DaysCollected ?? 0)} collected`} />
						<PaceMetric label="Required daily pace" value={report?.requiredDailyPace ?? 0} helper="Needed to clear outstanding" />
					</div>
					<ReportBarChart
						ariaLabel="Finance forecast scenarios"
						labels={report?.forecastScenarios.map((scenario) => scenario.label) ?? []}
						series={[
							{ label: "Projected collected", colour: "#147764", values: report?.forecastScenarios.map((scenario) => scenario.projectedCollected) ?? [] },
							{ label: "Projected shortfall", colour: "#dc2626", values: report?.forecastScenarios.map((scenario) => scenario.projectedShortfall) ?? [] },
						]}
					/>
				</div>
			</details>
		</div>
	);
}

function PaceMetric({ label, value, helper, tone = "default" }: { label: string; value: number; helper: string; tone?: "default" | "success" }) {
	return (
		<div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
			<p className="text-xs font-black text-slate-600">{label}</p>
			<p className={`mt-1 text-xl font-black ${tone === "success" ? "text-yepset-700" : "text-slate-950"}`}>{formatCurrency(value)}<span className="text-xs text-slate-500">/day</span></p>
			<p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
		</div>
	);
}

function BreakdownRow({ label, filter, seasonId, group, tone }: { label: string; filter: string; seasonId: string; group?: FinanceOutstandingGroup; tone: "danger" | "warning" | "success" | "neutral" }) {
	const count = group?.playerCount ?? 0;
	return (
		<Link to={`/finance?${new URLSearchParams({ status: filter, seasonId }).toString()}`} className="flex min-h-16 items-center gap-3 py-3 first:pt-0 last:pb-0">
			<span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${getBreakdownTone(tone)}`}>{count}</span>
			<span className="min-w-0 flex-1 text-sm font-semibold text-slate-700">{count} {count === 1 ? "player" : "players"} {label}</span>
			<span className="shrink-0 text-right text-sm font-black text-slate-700">{formatCurrency(group?.outstanding ?? 0)}<span className="block text-[10px] font-semibold text-slate-400">outstanding</span></span>
			<span className="text-slate-400">›</span>
		</Link>
	);
}

function getStatusClass(status?: string) {
	if (status === "Ahead of pace" || status === "On pace" || status === "On target") return "bg-emerald-100 text-emerald-800";
	if (status === "Behind pace") return "bg-red-100 text-red-800";
	return "bg-slate-100 text-slate-700";
}

function getBreakdownTone(tone: "danger" | "warning" | "success" | "neutral") {
	if (tone === "danger") return "bg-red-100 text-red-700";
	if (tone === "warning") return "bg-amber-100 text-amber-800";
	if (tone === "success") return "bg-emerald-100 text-emerald-800";
	return "bg-slate-100 text-slate-600";
}
