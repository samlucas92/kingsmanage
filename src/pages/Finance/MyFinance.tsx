import { useEffect, useMemo, useState } from "react";

import MetricCard from "../../components/compositions/MetricCard";
import PanelCard from "../../components/compositions/PanelCard";
import SeasonSelector from "../../components/compositions/SeasonSelector";
import { financeApi } from "../../services/financeApi";
import { useSeasonStore } from "../../stores/seasons";
import type { FinanceTransaction, PlayerFinanceSummary } from "../../types/finance";
import { formatDisplayDateTime } from "../../utils/date";
import { formatCurrency } from "../../utils/format";

export default function MyFinance() {
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);
	const seasonLoadError = useSeasonStore((state) => state.seasonLoadError);
	const [selectedSeasonId, setSelectedSeasonId] = useState("");
	const [summary, setSummary] = useState<PlayerFinanceSummary | null>(null);
	const [error, setError] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const effectiveSeasonId = selectedSeasonId || activeSeasonId;

	useEffect(() => {
		void loadSeasons();
	}, [loadSeasons]);

	useEffect(() => {
		if (!effectiveSeasonId) {
			return;
		}

		let isCurrent = true;

		void financeApi.getMyFinance(effectiveSeasonId)
			.then((financeSummary) => {
				if (isCurrent) {
					setSummary(financeSummary);
				}
			})
			.catch((loadError: unknown) => {
				if (isCurrent) {
					setError(loadError instanceof Error ? loadError.message : "Failed to load your finance record.");
				}
			});

		return () => {
			isCurrent = false;
		};
	}, [effectiveSeasonId]);

	const chartData = useMemo(() => buildMonthlyChartData(summary?.transactions ?? []), [summary]);

	return (
		<>
			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-base font-bold text-slate-700">My finances</h2>
						<p className="mt-1 text-xs text-slate-500">Current season balance</p>
					</div>
					{summary && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${summary.balance > 0 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>{summary.balance > 0 ? "Outstanding" : "Paid"}</span>}
				</div>

				{(error || seasonLoadError) && <p className="mt-4 text-sm font-semibold text-red-700">{error || seasonLoadError}</p>}
				{!summary && !error && <p className="mt-4 text-sm text-slate-500">Loading your balance...</p>}

				{summary && (
					<div className="mt-4">
						<div className="flex items-end justify-between gap-4">
							<div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Outstanding</p><p className={`mt-1 text-3xl font-black ${summary.balance > 0 ? "text-red-700" : "text-green-700"}`}>{formatCurrency(summary.balance)}</p></div>
							<p className="text-right text-sm text-slate-500"><strong className="text-slate-800">{getPaidPercentage(summary)}%</strong><br />paid</p>
						</div>
						<div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-green-600" style={{ width: `${getPaidPercentage(summary)}%` }} /></div>
						<button type="button" onClick={() => setIsOpen(true)} className="mt-4 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100">View finance details</button>
					</div>
				)}
			</section>

			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 sm:items-center sm:justify-center sm:p-5" role="dialog" aria-modal="true" aria-label="My finance details">
					<button type="button" className="absolute inset-0" onClick={() => setIsOpen(false)} aria-label="Close finance details" />
					<div className="relative z-10 max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-slate-100 shadow-2xl sm:max-w-6xl sm:rounded-3xl">
						<header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
							<div><h2 className="text-xl font-black text-blue-950">My finances</h2><p className="text-xs text-slate-500">Charges, payments, and transaction history</p></div>
							<button type="button" onClick={() => setIsOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-xl font-bold text-slate-600 hover:bg-slate-200" aria-label="Close">×</button>
						</header>

						<div className="space-y-5 p-4 sm:p-7">
							<div className="flex justify-end">
								<SeasonSelector label="View season" selectedSeasonId={effectiveSeasonId} onSeasonChange={(seasonId) => { setSummary(null); setError(""); setSelectedSeasonId(seasonId); }} />
							</div>
							{!summary && !error && <div className="rounded-xl bg-white p-5 text-sm text-slate-500">Loading your finance record...</div>}
							{error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

							{summary && <>
								<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
									<MetricCard label="Season total" value={formatCurrency(summary.amountOwed)} helper="Charges including adjustments" />
									<MetricCard label="Paid" value={formatCurrency(summary.totalPaid)} helper={`${getPaidPercentage(summary)}% complete`} tone="success" />
									<MetricCard label="Outstanding" value={formatCurrency(summary.balance)} helper={summary.balance > 0 ? "Still to pay" : "You are fully paid"} tone={summary.balance > 0 ? "danger" : "success"} />
									<MetricCard label="Adjustments" value={formatCurrency(summary.totalAdjustments)} helper="Discounts and corrections" />
								</div>
								<div className="grid gap-5 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.4fr)]">
									<PanelCard title="Payment progress" description="Paid against your season total."><PaymentProgressChart paid={summary.totalPaid} total={summary.amountOwed} /></PanelCard>
									<PanelCard title="Finance activity" description="Charges and payments by month."><MonthlyFinanceChart data={chartData} /></PanelCard>
								</div>
								<PanelCard title="Transaction history" description="A read-only record maintained by the club."><TransactionHistory transactions={summary.transactions} /></PanelCard>
							</>}
						</div>
					</div>
				</div>
			)}
		</>
	);
}

function PaymentProgressChart({ paid, total }: { paid: number; total: number }) {
	const percentage = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 100;
	const circumference = 2 * Math.PI * 52;
	const offset = circumference - (percentage / 100) * circumference;

	return (
		<div className="flex flex-col items-center py-2 sm:flex-row sm:justify-center sm:gap-8">
			<div className="relative h-40 w-40">
				<svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-label={`${percentage}% paid`}>
					<circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="12" />
					<circle cx="60" cy="60" r="52" fill="none" stroke="#16a34a" strokeLinecap="round" strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={offset} />
				</svg>
				<div className="absolute inset-0 grid place-items-center text-center">
					<div><p className="text-3xl font-black text-slate-900">{percentage}%</p><p className="text-xs font-bold text-slate-500">paid</p></div>
				</div>
			</div>
			<div className="mt-4 space-y-2 text-sm sm:mt-0">
				<p><span className="inline-block h-3 w-3 rounded-full bg-green-600" /> <span className="ml-2 font-semibold text-slate-600">Paid</span> <strong className="ml-2">{formatCurrency(paid)}</strong></p>
				<p><span className="inline-block h-3 w-3 rounded-full bg-slate-200" /> <span className="ml-2 font-semibold text-slate-600">Remaining</span> <strong className="ml-2">{formatCurrency(Math.max(0, total - paid))}</strong></p>
			</div>
		</div>
	);
}

type MonthlyChartItem = { key: string; label: string; charged: number; paid: number };

function MonthlyFinanceChart({ data }: { data: MonthlyChartItem[] }) {
	if (data.length === 0) {
		return <p className="py-12 text-center text-sm text-slate-500">No activity to chart for this season.</p>;
	}

	const maximum = Math.max(...data.flatMap((item) => [item.charged, item.paid]), 1);
	return (
		<div>
			<div className="flex h-56 items-end gap-3 border-b border-slate-200 px-2 pt-4 sm:gap-6">
				{data.map((item) => (
					<div key={item.key} className="flex min-w-0 flex-1 flex-col items-center justify-end self-stretch">
						<div className="flex h-full w-full items-end justify-center gap-1 sm:gap-2">
							<ChartBar value={item.charged} maximum={maximum} className="bg-blue-700" label={`${item.label} charged ${formatCurrency(item.charged)}`} />
							<ChartBar value={item.paid} maximum={maximum} className="bg-green-600" label={`${item.label} paid ${formatCurrency(item.paid)}`} />
						</div>
						<p className="mt-2 truncate text-[11px] font-bold text-slate-500">{item.label}</p>
					</div>
				))}
			</div>
			<div className="mt-4 flex justify-center gap-5 text-xs font-semibold text-slate-600"><span><i className="mr-2 inline-block h-3 w-3 rounded-sm bg-blue-700" />Charged</span><span><i className="mr-2 inline-block h-3 w-3 rounded-sm bg-green-600" />Paid</span></div>
		</div>
	);
}

function ChartBar({ value, maximum, className, label }: { value: number; maximum: number; className: string; label: string }) {
	const height = value > 0 ? Math.max(5, (value / maximum) * 100) : 0;
	return <div title={label} aria-label={label} className={`w-full max-w-9 rounded-t-md transition-all ${className}`} style={{ height: `${height}%` }} />;
}

function TransactionHistory({ transactions }: { transactions: FinanceTransaction[] }) {
	if (transactions.length === 0) {
		return <p className="text-sm text-slate-500">No transactions have been recorded for this season.</p>;
	}

	return (
		<div className="divide-y divide-slate-100">
			{transactions.map((transaction) => (
				<div key={transaction.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getTransactionClass(transaction.type)}`}>{transaction.type}</span><span className="text-xs text-slate-400">{formatDisplayDateTime(transaction.transactionDate)}</span></div>
						{transaction.note && <p className="mt-2 text-sm text-slate-600">{transaction.note}</p>}
					</div>
					<p className={`shrink-0 font-black ${transaction.type === "Payment" || transaction.amount < 0 ? "text-green-700" : "text-slate-900"}`}>{transaction.type === "Payment" ? "−" : transaction.amount < 0 ? "−" : "+"}{formatCurrency(Math.abs(transaction.amount))}</p>
				</div>
			))}
		</div>
	);
}

function buildMonthlyChartData(transactions: FinanceTransaction[]): MonthlyChartItem[] {
	const buckets = new Map<string, MonthlyChartItem>();
	for (const transaction of transactions) {
		const date = new Date(transaction.transactionDate);
		const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
		const item = buckets.get(key) ?? { key, label: date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }), charged: 0, paid: 0 };
		if (transaction.type === "Payment") item.paid += transaction.amount;
		else item.charged = Math.max(0, item.charged + transaction.amount);
		buckets.set(key, item);
	}
	return [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key)).slice(-6);
}

function getPaidPercentage(summary: PlayerFinanceSummary) {
	return summary.amountOwed > 0 ? Math.min(100, Math.round((summary.totalPaid / summary.amountOwed) * 100)) : 100;
}

function getTransactionClass(type: FinanceTransaction["type"]) {
	if (type === "Payment") return "bg-green-100 text-green-800";
	if (type === "Adjustment") return "bg-amber-100 text-amber-800";
	return "bg-blue-100 text-blue-800";
}
