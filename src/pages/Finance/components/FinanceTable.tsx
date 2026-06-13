import { useState } from "react";
import type { Player } from "../../../stores/players";
import type { PlayerFinanceRecord } from "../../../types/finance";
import type { FinanceRowData } from "../../../services/financeService";
import StatusBadge from "../../../components/compositions/StatusBadge";
import DataTable from "../../../components/compositions/DataTable";
import ActionMenu from "../../../components/compositions/ActionMenu";
import { formatCurrency, formatDateTime } from "../../../utils/format";

type FinanceTableProps = {
	rows: FinanceRowData[];
	activeSeasonId: string;
	onSetOwed: (player: Player) => void;
	onAddPayment: (player: Player) => void;
	onAddAdjustment: (player: Player) => void;
	onRemovePayment: (
		playerId: string,
		paymentId: string,
		seasonId: string
	) => void;
};

export default function FinanceTable({
	rows,
	activeSeasonId,
	onSetOwed,
	onAddPayment,
	onAddAdjustment,
	onRemovePayment,
}: FinanceTableProps) {
	if (rows.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
				No finance records match this filter.
			</div>
		);
	}

	return (
		<>
			<div className="space-y-3 md:hidden">
				{rows.map((row) => (
					<FinanceMobileCard
						key={row.player.id}
						{...row}
						activeSeasonId={activeSeasonId}
						onSetOwed={() => onSetOwed(row.player)}
						onAddPayment={() => onAddPayment(row.player)}
						onAddAdjustment={() => onAddAdjustment(row.player)}
						onRemovePayment={onRemovePayment}
					/>
				))}
			</div>

			<DataTable className="hidden md:block overflow-x-auto">
				<table className="w-full min-w-[820px] divide-y divide-slate-200 text-sm">
					<thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
						<tr>
							<th className="px-4 py-3">Player</th>
							<th className="px-4 py-3 text-right whitespace-nowrap">Owed</th>
							<th className="px-4 py-3 text-right whitespace-nowrap">Paid</th>
							<th className="px-4 py-3 text-right whitespace-nowrap">Outstanding</th>
							<th className="px-4 py-3 whitespace-nowrap">Status</th>
							<th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100 bg-white">
						{rows.map((row) => (
							<FinanceRow
								key={row.player.id}
								{...row}
								activeSeasonId={activeSeasonId}
								onSetOwed={() => onSetOwed(row.player)}
								onAddPayment={() => onAddPayment(row.player)}
								onAddAdjustment={() => onAddAdjustment(row.player)}
								onRemovePayment={onRemovePayment}
							/>
						))}
					</tbody>
				</table>
			</DataTable>
		</>
	);
}

function FinanceMobileCard({
	player,
	record,
	amountOwed,
	totalPaid,
	balance,
	status,
	activeSeasonId,
	onSetOwed,
	onAddPayment,
	onAddAdjustment,
	onRemovePayment,
}: {
	player: Player;
	record?: PlayerFinanceRecord;
	amountOwed: number;
	totalPaid: number;
	balance: number;
	status: string;
	activeSeasonId: string;
	onSetOwed: () => void;
	onAddPayment: () => void;
	onAddAdjustment: () => void;
	onRemovePayment: (
		playerId: string,
		paymentId: string,
		seasonId: string
	) => void;
}) {
	const [showPayments, setShowPayments] = useState(false);
	const statusBadge = getFinanceStatusBadge(status);
	const payments = record?.payments ?? [];

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="font-semibold text-slate-900">{player.name}</p>
					<p className="text-xs text-slate-500">
						#{player.number} · {player.isActive ? "Active" : "Inactive"}
					</p>
				</div>
				<StatusBadge label={statusBadge.label} tone={statusBadge.tone} />
			</div>

			<div className="mt-4 grid grid-cols-3 gap-2 text-center">
				<FinanceAmountBlock label="Owed" value={amountOwed} />
				<FinanceAmountBlock label="Paid" value={totalPaid} tone="success" />
				<FinanceAmountBlock
					label="Outstanding"
					value={balance}
					tone={balance > 0 ? "danger" : "success"}
				/>
			</div>

			<div className="mt-4 flex justify-end">
				<FinanceActionsMenu
					paymentsCount={payments.length}
					showPayments={showPayments}
					onSetOwed={onSetOwed}
					onAddPayment={onAddPayment}
					onAddAdjustment={onAddAdjustment}
					onTogglePayments={() => setShowPayments((current) => !current)}
				/>
			</div>

			{showPayments && (
				<div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3">
					{payments.length === 0 ? (
						<p className="text-sm text-slate-500">
							No payments recorded for this player yet.
						</p>
					) : (
						payments.map((payment) => (
							<div
								key={payment.id}
								className="flex items-start justify-between gap-3 rounded-lg bg-white p-3 text-sm"
							>
								<div>
									<p className="font-semibold text-slate-900">
										{formatCurrency(payment.amount)}
									</p>
									<p className="text-xs text-slate-500">
										{formatDateTime(payment.paidAt)}
									</p>
									{payment.note && (
										<p className="mt-1 text-xs text-slate-500">
											{payment.note}
										</p>
									)}
								</div>
								<button
									type="button"
									onClick={() =>
										onRemovePayment(
											player.id,
											payment.id,
											activeSeasonId
										)
									}
									className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
								>
									Remove
								</button>
							</div>
						))
					)}
				</div>
			)}
		</div>
	);
}

function FinanceAmountBlock({
	label,
	value,
	tone = "default",
}: {
	label: string;
	value: number;
	tone?: "default" | "success" | "danger";
}) {
	return (
		<div className="rounded-xl bg-slate-50 p-3">
			<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
				{label}
			</p>
			<p
				className={`mt-1 font-bold ${
					tone === "success"
						? "text-green-700"
						: tone === "danger"
							? "text-red-700"
							: "text-slate-900"
				}`}
			>
				{formatCurrency(value)}
			</p>
		</div>
	);
}

function FinanceRow({
	player,
	record,
	amountOwed,
	totalPaid,
	balance,
	status,
	activeSeasonId,
	onSetOwed,
	onAddPayment,
	onAddAdjustment,
	onRemovePayment,
}: {
	player: Player;
	record?: PlayerFinanceRecord;
	amountOwed: number;
	totalPaid: number;
	balance: number;
	status: string;
	activeSeasonId: string;
	onSetOwed: () => void;
	onAddPayment: () => void;
	onAddAdjustment: () => void;
	onRemovePayment: (
		playerId: string,
		paymentId: string,
		seasonId: string
	) => void;
}) {
	const [showPayments, setShowPayments] = useState(false);
	const statusBadge = getFinanceStatusBadge(status);
	const paymentsCount = record?.payments.length ?? 0;

	return (
		<>
			<tr>
				<td className="px-4 py-3">
					<p className="font-semibold text-slate-900">{player.name}</p>
					<p className="text-xs text-slate-500">
						#{player.number} · {player.isActive ? "Active" : "Inactive"}
					</p>
				</td>
				<td className="px-4 py-3 text-right font-semibold text-slate-900">
					{formatCurrency(amountOwed)}
				</td>
				<td className="px-4 py-3 text-right text-green-700">
					{formatCurrency(totalPaid)}
				</td>
				<td
					className={`px-4 py-3 text-right font-semibold ${
						balance > 0 ? "text-red-700" : "text-green-700"
					}`}
				>
					{formatCurrency(balance)}
				</td>
				<td className="px-4 py-3 whitespace-nowrap">
					<StatusBadge
						label={statusBadge.label}
						tone={statusBadge.tone}
						className="inline-flex whitespace-nowrap px-2.5 py-1 text-xs"
					/>
				</td>
				<td className="px-4 py-3 text-right align-middle">
					<FinanceActionsMenu
						paymentsCount={paymentsCount}
						showPayments={showPayments}
						onSetOwed={onSetOwed}
						onAddPayment={onAddPayment}
						onAddAdjustment={onAddAdjustment}
						onTogglePayments={() => setShowPayments((current) => !current)}
					/>
				</td>
			</tr>
			{showPayments && (
				<tr>
					<td colSpan={6} className="bg-slate-50 px-4 py-3">
						{!record || record.payments.length === 0 ? (
							<p className="text-sm text-slate-500">
								No payments recorded for this player yet.
							</p>
						) : (
							<div className="space-y-2">
								{record.payments.map((payment) => (
									<div
										key={payment.id}
										className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
									>
										<span>
											<strong>{formatCurrency(payment.amount)}</strong>
											{" · "}
											{formatDateTime(payment.paidAt)}
											{payment.note ? ` · ${payment.note}` : ""}
										</span>
										<button
											type="button"
											onClick={() =>
												onRemovePayment(
													player.id,
													payment.id,
													activeSeasonId
												)
											}
											className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
										>
											Remove
										</button>
									</div>
								))}
							</div>
						)}
					</td>
				</tr>
			)}
		</>
	);
}

function FinanceActionsMenu({
	paymentsCount,
	showPayments,
	onSetOwed,
	onAddPayment,
	onAddAdjustment,
	onTogglePayments,
}: {
	paymentsCount: number;
	showPayments: boolean;
	onSetOwed: () => void;
	onAddPayment: () => void;
	onAddAdjustment: () => void;
	onTogglePayments: () => void;
}) {
	return (
		<ActionMenu
			className="justify-end"
			items={[
				{ label: "Set owed", onClick: onSetOwed },
				{ label: "Add payment", onClick: onAddPayment },
				{ label: "Add adjustment", onClick: onAddAdjustment },
				{
					label: showPayments
						? "Hide payments"
						: `Payments (${paymentsCount})`,
					onClick: onTogglePayments,
				},
			]}
		/>
	);
}

function getFinanceStatusBadge(status: string): {
	label: string;
	tone: "success" | "warning" | "danger" | "neutral";
} {
	if (status === "paid") {
		return { label: "Paid", tone: "success" };
	}

	if (status === "part-paid") {
		return { label: "Part paid", tone: "warning" };
	}

	if (status === "unpaid") {
		return { label: "Unpaid", tone: "danger" };
	}

	return { label: "No charge", tone: "neutral" };
}
