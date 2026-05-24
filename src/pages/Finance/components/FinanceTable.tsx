import { useState } from "react";
import type { Player } from "../../../stores/players";
import type { PlayerFinanceRecord } from "../../../types/finance";
import type { FinanceRowData } from "../../../services/financeService";
import StatusBadge from "../../../components/compositions/StatusBadge";
import DataTable from "../../../components/compositions/DataTable";
import { formatCurrency, formatDateTime } from "../../../utils/format";

type FinanceTableProps = {
	rows: FinanceRowData[];
	activeSeasonId: string;
	onSetOwed: (player: Player) => void;
	onAddPayment: (player: Player) => void;
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
	onRemovePayment,
}: FinanceTableProps) {
	return (
		<DataTable
			empty={rows.length === 0}
			emptyTitle="No finance records found"
			emptyMessage="No players match this finance filter for the active season."
			minWidthClassName="min-w-[900px]"
		>
			<thead className="border-b bg-gray-50">
				<tr className="text-left">
					<th className="p-3">Player</th>
					<th className="p-3">Owed</th>
					<th className="p-3">Paid</th>
					<th className="p-3">Outstanding</th>
					<th className="p-3">Status</th>
					<th className="p-3 text-right">Actions</th>
				</tr>
			</thead>

			<tbody>
				{rows.map((row) => (
					<FinanceRow
						key={row.player.id}
						player={row.player}
						record={row.record}
						amountOwed={row.amountOwed}
						totalPaid={row.totalPaid}
						balance={row.balance}
						status={row.status}
						activeSeasonId={activeSeasonId}
						onSetOwed={() => onSetOwed(row.player)}
						onAddPayment={() => onAddPayment(row.player)}
						onRemovePayment={onRemovePayment}
					/>
				))}
			</tbody>
		</DataTable>
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
	onRemovePayment: (
		playerId: string,
		paymentId: string,
		seasonId: string
	) => void;
}) {
	const [showPayments, setShowPayments] = useState(false);
	const statusBadge = getFinanceStatusBadge(status);

	return (
		<>
			<tr className="border-b hover:bg-gray-50">
				<td className="p-3">
					<div>
						<p className="font-semibold text-blue-900">{player.name}</p>

						<p className="text-xs text-slate-500">
							#{player.number} · {player.isActive ? "Active" : "Inactive"}
						</p>
					</div>
				</td>

				<td className="p-3">{formatCurrency(amountOwed)}</td>
				<td className="p-3">{formatCurrency(totalPaid)}</td>

				<td className="p-3 font-semibold">
					<span className={balance > 0 ? "text-red-700" : "text-green-700"}>
						{formatCurrency(balance)}
					</span>
				</td>

				<td className="p-3">
					<StatusBadge label={statusBadge.label} tone={statusBadge.tone} />
				</td>

				<td className="p-3">
					<div className="flex flex-wrap justify-end gap-2">
						<button
							type="button"
							onClick={onSetOwed}
							className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-100"
						>
							Set Owed
						</button>

						<button
							type="button"
							onClick={onAddPayment}
							className="rounded-lg border border-green-200 px-3 py-1 text-sm text-green-700 hover:bg-green-50"
						>
							Add Payment
						</button>

						<button
							type="button"
							onClick={() => setShowPayments((current) => !current)}
							className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-100"
						>
							{showPayments ? "Hide" : "Payments"}
						</button>
					</div>
				</td>
			</tr>

			{showPayments && (
				<tr className="border-b bg-slate-50">
					<td colSpan={6} className="p-4">
						{!record || record.payments.length === 0 ? (
							<p className="text-sm text-slate-500">
								No payments recorded for this player yet.
							</p>
						) : (
							<div className="space-y-2">
								{record.payments.map((payment) => (
									<div
										key={payment.id}
										className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3 shadow-sm"
									>
										<div>
											<p className="text-sm font-semibold text-slate-900">
												{formatCurrency(payment.amount)}
											</p>

											<p className="text-xs text-slate-500">
												{formatDateTime(payment.paidAt)}
												{payment.note ? ` · ${payment.note}` : ""}
											</p>
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

function getFinanceStatusBadge(status: string): {
	label: string;
	tone: "success" | "warning" | "danger" | "neutral";
} {
	if (status === "paid") {
		return {
			label: "Paid",
			tone: "success",
		};
	}

	if (status === "part-paid") {
		return {
			label: "Part paid",
			tone: "warning",
		};
	}

	if (status === "unpaid") {
		return {
			label: "Unpaid",
			tone: "danger",
		};
	}

	return {
		label: "Nothing owed",
		tone: "neutral",
	};
}