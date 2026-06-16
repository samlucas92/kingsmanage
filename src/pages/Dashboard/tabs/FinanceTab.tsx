import EmptyState from "../../../components/compositions/EmptyState";
import LinkButton from "../../../components/compositions/LinkButton";
import MetricCard from "../../../components/compositions/MetricCard";
import PanelCard from "../../../components/compositions/PanelCard";
import type { FinanceRowData } from "../../../services/financeService";
import { formatCurrency } from "../../../utils/format";

export default function FinanceTab({
	financeOutstanding,
	financePaidPercentage,
	financeWatchlist,
	playersOwingCount,
	totalExpected,
	totalPaid,
}: {
	financeOutstanding: number;
	financePaidPercentage: number;
	financeWatchlist: FinanceRowData[];
	playersOwingCount: number;
	totalExpected: number;
	totalPaid: number;
}) {
	return (
		<div className="space-y-6">
			<div className="grid gap-5 lg:grid-cols-3">
				<MetricCard
					label="Expected"
					value={formatCurrency(totalExpected)}
					helper="Current season charges"
				/>

				<MetricCard
					label="Paid"
					value={formatCurrency(totalPaid)}
					helper={`${financePaidPercentage}% paid`}
					tone="success"
				/>

				<MetricCard
					label="Outstanding"
					value={formatCurrency(financeOutstanding)}
					helper={`${playersOwingCount} players owing`}
					tone={financeOutstanding > 0 ? "danger" : "success"}
				/>
			</div>

			<PanelCard
				action={<DashboardLinkButton to="/finance">Open finance page</DashboardLinkButton>}
				description="Top active players with an outstanding balance."
				title="Finance watchlist"
			>
				<div className="space-y-3">
					{financeWatchlist.map((row) => (
						<div
							key={row.player.id}
							className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
						>
							<div>
								<p className="font-bold text-slate-900">{row.player.name}</p>
								<p className="text-sm text-slate-500">
									Paid {formatCurrency(row.totalPaid)} of {formatCurrency(row.amountOwed)}
								</p>
							</div>

							<p className="text-lg font-bold text-red-700">{formatCurrency(row.balance)}</p>
						</div>
					))}

					{financeWatchlist.length === 0 && (
						<EmptyState
							title="No outstanding balances"
							message="No active players have an outstanding balance."
						/>
					)}
				</div>
			</PanelCard>
		</div>
	);
}

function DashboardLinkButton({ children, to }: { children: string; to: string }) {
	return (
		<LinkButton
			to={to}
			className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:no-underline"
		>
			{children}
		</LinkButton>
	);
}
