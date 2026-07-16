import { useEffect, useState } from "react";
import ReportBarChart from "../../components/charts/ReportBarChart";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportDoughnutChart from "../../components/charts/ReportDoughnutChart";
import ReportEmptyState from "../../components/ReportEmptyState";
import ReportMetricCard from "../../components/ReportMetricCard";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportPanel from "../../components/ReportPanel";
import { useReportsContext } from "../../ReportsContext";
import { reportsApi, type FinanceReportResponse } from "../../../../services/reportsApi";
import { formatCurrency } from "../../../../utils/format";

export default function FinanceReport() {
	const { selectedSeasonId, isLoading, loadError } = useReportsContext();
	const [report, setReport] = useState<FinanceReportResponse | null>(null);
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

		reportsApi.getFinanceReport(selectedSeasonId)
			.then((response) => {
				if (isCurrent) setReport(response);
			})
			.catch((error) => {
				if (isCurrent) {
					setReportError(error instanceof Error ? error.message : "Failed to load finance report.");
					setReport(null);
				}
			})
			.finally(() => {
				if (isCurrent) setIsLoadingReport(false);
			});

		return () => {
			isCurrent = false;
		};
	}, [selectedSeasonId]);

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Finance"
				description="Collections, outstanding totals and season-end projection."
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
				<ReportMetricCard label="Expected" value={formatCurrency(report?.expected ?? 0)} />
				<ReportMetricCard label="Collected" value={formatCurrency(report?.collected ?? 0)} tone="success" helper={`${report?.paidPercentage ?? 0}% collected`} />
				<ReportMetricCard label="Outstanding" value={formatCurrency(report?.outstanding ?? 0)} tone={(report?.outstanding ?? 0) > 0 ? "danger" : "success"} />
				<ReportMetricCard label="Projected collection" value={formatCurrency(report?.projectedCollected ?? 0)} helper={`${report?.elapsedPercentage ?? 0}% of season elapsed`} />
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
					description="Payments received by month."
					isEmpty={!report || report.months.length === 0}
				>
					<ReportBarChart
						ariaLabel="Finance collected by month"
						labels={report?.months.map((item) => item.label) ?? []}
						series={[
							{
								label: "Collected",
								colour: "#147764",
								values: report?.months.map((item) => item.collected) ?? [],
							},
							{
								label: "Charged",
								colour: "#2563eb",
								values: report?.months.map((item) => item.charged) ?? [],
							},
						]}
					/>
				</ReportChartContainer>
			</div>

			<ReportPanel title="Season projection" description="Projection is based on collection rate so far, not a payment guarantee.">
				<div className="grid gap-3 md:grid-cols-3">
					<ProjectionCard label="Projected shortfall" value={formatCurrency(report?.projectedShortfall ?? 0)} tone={(report?.projectedShortfall ?? 0) > 0 ? "danger" : "success"} />
					<ProjectionCard label="Daily collection pace" value={formatCurrency(report?.dailyPace ?? 0)} />
					<ProjectionCard label="Required remaining pace" value={formatCurrency(report?.requiredDailyPace ?? 0)} />
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
	tone = "default",
}: {
	label: string;
	value: string;
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
		</div>
	);
}
