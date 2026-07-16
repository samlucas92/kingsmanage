import ReportBarChart from "../../components/charts/ReportBarChart";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportDoughnutChart from "../../components/charts/ReportDoughnutChart";
import ReportEmptyState from "../../components/ReportEmptyState";
import ReportMetricCard from "../../components/ReportMetricCard";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportPanel from "../../components/ReportPanel";
import { useReportsContext } from "../../ReportsContext";
import { useFinanceStore } from "../../../../stores/finance";
import { usePlayerStore } from "../../../../stores/players";
import { useSeasonStore } from "../../../../stores/seasons";
import {
	buildFinanceRows,
	getFinanceSummary,
	type FinanceRowData,
} from "../../../../services/financeService";
import { formatCurrency } from "../../../../utils/format";

export default function FinanceReport() {
	const { selectedSeasonId, isLoading, loadError } = useReportsContext();
	const players = usePlayerStore((state) => state.players);
	const playerFinanceRecords = useFinanceStore((state) => state.playerFinanceRecords);
	const seasons = useSeasonStore((state) => state.seasons);
	const selectedSeason = seasons.find((season) => season.id === selectedSeasonId);
	const financeRows = buildFinanceRows({
		players,
		playerFinanceRecords,
		seasonId: selectedSeasonId,
		includeInactive: false,
	});
	const summary = getFinanceSummary(financeRows);
	const projection = getFinanceProjection({
		summary,
		seasonStartDate: selectedSeason?.startDate,
		seasonEndDate: selectedSeason?.endDate,
	});
	const monthlyCollections = getMonthlyCollections(financeRows);

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Finance"
				description="Collections, outstanding totals and season-end projection."
				showTeamFilter={false}
			/>

			{loadError && (
				<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
					{loadError}
				</div>
			)}
			{isLoading && (
				<div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500">
					Loading report data...
				</div>
			)}

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<ReportMetricCard label="Expected" value={formatCurrency(summary.totalExpected)} />
				<ReportMetricCard label="Collected" value={formatCurrency(summary.totalPaid)} tone="success" helper={`${summary.paidPercentage}% collected`} />
				<ReportMetricCard label="Outstanding" value={formatCurrency(summary.totalOutstanding)} tone={summary.totalOutstanding > 0 ? "danger" : "success"} />
				<ReportMetricCard label="Projected collection" value={formatCurrency(projection.projectedCollected)} helper={`${projection.elapsedPercentage}% of season elapsed`} />
			</div>

			<div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
				<ReportChartContainer
					title="Collection progress"
					description="Collected versus outstanding for this season."
					isEmpty={summary.totalExpected === 0}
				>
					<ReportDoughnutChart
						ariaLabel="Finance collected versus outstanding"
						centerValue={`${summary.paidPercentage}%`}
						centerLabel="collected"
						segments={[
							{ label: "Collected", value: summary.totalPaid, colour: "#147764" },
							{ label: "Outstanding", value: summary.totalOutstanding, colour: "#dc2626" },
						]}
					/>
				</ReportChartContainer>

				<ReportChartContainer
					title="Collections over time"
					description="Payments received by month."
					isEmpty={monthlyCollections.length === 0}
				>
					<ReportBarChart
						ariaLabel="Finance collected by month"
						labels={monthlyCollections.map((item) => item.label)}
						series={[
							{
								label: "Collected",
								colour: "#147764",
								values: monthlyCollections.map((item) => item.amount),
							},
						]}
					/>
				</ReportChartContainer>
			</div>

			<ReportPanel title="Season projection" description="Projection is based on collection rate so far, not a payment guarantee.">
				<div className="grid gap-3 md:grid-cols-3">
					<ProjectionCard label="Projected shortfall" value={formatCurrency(projection.projectedShortfall)} tone={projection.projectedShortfall > 0 ? "danger" : "success"} />
					<ProjectionCard label="Daily collection pace" value={formatCurrency(projection.dailyPace)} />
					<ProjectionCard label="Required remaining pace" value={formatCurrency(projection.requiredDailyPace)} />
				</div>
			</ReportPanel>

			<ReportPanel title="Finance report notes" description="Operational payment management stays in the Finance area.">
				{summary.totalExpected === 0 ? (
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

function getMonthlyCollections(rows: FinanceRowData[]) {
	const months = new Map<string, { label: string; timestamp: number; amount: number }>();

	rows.forEach((row) => {
		row.record?.transactions
			?.filter((transaction) => transaction.type === "Payment")
			.forEach((transaction) => {
				const date = new Date(transaction.transactionDate);
				const key = `${date.getFullYear()}-${date.getMonth()}`;
				const existing = months.get(key) ?? {
					label: date.toLocaleDateString("en-GB", { month: "short" }),
					timestamp: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
					amount: 0,
				};

				existing.amount += transaction.amount;
				months.set(key, existing);
			});
	});

	return [...months.values()].sort((firstMonth, secondMonth) => firstMonth.timestamp - secondMonth.timestamp);
}

function getFinanceProjection({
	summary,
	seasonStartDate,
	seasonEndDate,
}: {
	summary: ReturnType<typeof getFinanceSummary>;
	seasonStartDate?: string;
	seasonEndDate?: string;
}) {
	const now = Date.now();
	const seasonStart = seasonStartDate ? new Date(seasonStartDate).getTime() : now;
	const seasonEnd = seasonEndDate ? new Date(seasonEndDate).getTime() : now;
	const seasonLength = Math.max(1, seasonEnd - seasonStart);
	const elapsed = Math.min(Math.max(now - seasonStart, 0), seasonLength);
	const remaining = Math.max(seasonEnd - now, 0);
	const elapsedRatio = elapsed / seasonLength;
	const projectedCollected = elapsedRatio > 0
		? Math.min(summary.totalExpected, summary.totalPaid / elapsedRatio)
		: summary.totalPaid;
	const daysElapsed = Math.max(1, Math.ceil(elapsed / 86_400_000));
	const daysRemaining = Math.max(1, Math.ceil(remaining / 86_400_000));

	return {
		elapsedPercentage: Math.round(elapsedRatio * 100),
		projectedCollected,
		projectedShortfall: Math.max(0, summary.totalExpected - projectedCollected),
		dailyPace: summary.totalPaid / daysElapsed,
		requiredDailyPace: Math.max(0, summary.totalOutstanding / daysRemaining),
	};
}
