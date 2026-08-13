import { useMemo, useState } from "react";
import type { Player } from "../../../stores/players";
import type {
	FinanceTransaction,
	FinanceTransactionType,
	PlayerFinanceRecord,
} from "../../../types/finance";
import type { FinanceRowData } from "../../../services/financeService";
import StatusBadge from "../../../components/compositions/StatusBadge";
import DataTable from "../../../components/compositions/DataTable";
import ActionMenu from "../../../components/compositions/ActionMenu";
import { formatCurrency, formatDateTime } from "../../../utils/format";

type RemoveTransactionDetails = {
	playerName: string;
	amount: number;
	type: string;
};

type FinanceTableProps = {
	rows: FinanceRowData[];
	activeSeasonId: string;
	onSetOwed: (player: Player) => void;
	onAddPayment: (player: Player) => void;
	onAddAdjustment: (player: Player) => void;
	onRemovePayment: (
		playerId: string,
		paymentId: string,
		seasonId: string,
		details: RemoveTransactionDetails
	) => void;
};

type DisplayTransaction = {
	id: string;
	type: FinanceTransactionType | "Payment";
	amount: number;
	note?: string;
	date: string;
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
			<div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
				No finance records match this filter.
			</div>
		);
	}

	return (
		<>
			<div className="-mx-5 divide-y divide-slate-100 border-y border-slate-100 lg:hidden">
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

			<div className="hidden lg:block">
				<DataTable minWidthClassName="min-w-[760px]">
					<thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
						<tr>
							<th className="px-4 py-3">Player</th>
							<th className="px-4 py-3">Payment progress</th>
							<th className="px-4 py-3">Amount due</th>
							<th className="px-4 py-3">Status</th>
							<th className="px-4 py-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100 bg-white text-sm">
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
				</DataTable>
			</div>
		</>
	);
}

function FinanceMobileCard({
	player,
	record,
	amountOwed,
	totalPaid,
	balance,
	activeSeasonId,
	onSetOwed,
	onAddPayment,
	onAddAdjustment,
	onRemovePayment,
}: FinanceRowData & {
	activeSeasonId: string;
	onSetOwed: () => void;
	onAddPayment: () => void;
	onAddAdjustment: () => void;
	onRemovePayment: FinanceTableProps["onRemovePayment"];
}) {
	const [showTransactions, setShowTransactions] = useState(false);
	const transactions = useDisplayTransactions(record);

	return (
		<div className="px-4 py-3">
			<div className="flex items-center gap-3">
				<div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-yepset-100 text-xs font-black text-yepset-900">
					{getInitials(player.name)}
				</div>

				<div className="min-w-0 flex-1">
					<h3 className="truncate text-sm font-black text-slate-950">{player.name}</h3>
					<p className="mt-0.5 text-xs font-semibold text-slate-500">
						{formatCurrency(totalPaid)} paid of {formatCurrency(amountOwed)}
					</p>
				</div>

				<div className="shrink-0 text-right">
					<p className={`text-sm font-black ${balance > 0 ? "text-red-700" : "text-yepset-700"}`}>
						{balance > 0 ? `${formatCurrency(balance)} due` : "Paid in full"}
					</p>
				</div>

				<FinanceActionsMenu
					transactionsCount={transactions.length}
					showTransactions={showTransactions}
					onSetOwed={onSetOwed}
					onAddPayment={onAddPayment}
					onAddAdjustment={onAddAdjustment}
					onToggleTransactions={() =>
						setShowTransactions((current) => !current)
					}
				/>
			</div>

			{showTransactions && (
				<TransactionList
					player={player}
					transactions={transactions}
					activeSeasonId={activeSeasonId}
					onRemovePayment={onRemovePayment}
				/>
			)}
		</div>
	);
}

function getInitials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");
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
}: FinanceRowData & {
	activeSeasonId: string;
	onSetOwed: () => void;
	onAddPayment: () => void;
	onAddAdjustment: () => void;
	onRemovePayment: FinanceTableProps["onRemovePayment"];
}) {
	const [showTransactions, setShowTransactions] = useState(false);
	const statusBadge = getFinanceStatusBadge(status);
	const transactions = useDisplayTransactions(record);

	return (
		<>
			<tr className="align-top">
				<td className="px-4 py-3">
					<div className="font-semibold text-blue-950">{player.name}</div>
					<div className="text-xs text-slate-500">
						#{player.number} · {player.isActive ? "Active" : "Inactive"}
					</div>
				</td>
				<td className="px-4 py-3">
					<p className="font-semibold text-slate-800">{formatCurrency(totalPaid)} paid of {formatCurrency(amountOwed)}</p>
					{getTotalAdjustments(record) !== 0 && <p className="mt-0.5 text-xs text-slate-500">Includes {formatCurrency(getTotalAdjustments(record))} adjustments</p>}
				</td>
				<td
					className={`px-4 py-3 font-semibold ${
						balance > 0 ? "text-red-700" : "text-green-700"
					}`}
				>
					{balance > 0 ? `${formatCurrency(balance)} due` : "Paid in full"}
				</td>
				<td className="px-4 py-3">
					<StatusBadge label={statusBadge.label} tone={statusBadge.tone} />
				</td>
				<td className="px-4 py-3 text-right">
					<FinanceActionsMenu
						transactionsCount={transactions.length}
						showTransactions={showTransactions}
						onSetOwed={onSetOwed}
						onAddPayment={onAddPayment}
						onAddAdjustment={onAddAdjustment}
						onToggleTransactions={() =>
							setShowTransactions((current) => !current)
						}
					/>
				</td>
			</tr>
			{showTransactions && (
				<tr>
					<td colSpan={5} className="bg-slate-50 px-4 py-4">
						<TransactionList
							player={player}
							transactions={transactions}
							activeSeasonId={activeSeasonId}
							onRemovePayment={onRemovePayment}
						/>
					</td>
				</tr>
			)}
		</>
	);
}

function FinanceActionsMenu({
	transactionsCount,
	showTransactions,
	onSetOwed,
	onAddPayment,
	onAddAdjustment,
	onToggleTransactions,
}: {
	transactionsCount: number;
	showTransactions: boolean;
	onSetOwed: () => void;
	onAddPayment: () => void;
	onAddAdjustment: () => void;
	onToggleTransactions: () => void;
}) {
	return (
		<ActionMenu
			items={[
				{
					label: "Set owed",
					onClick: onSetOwed,
				},
				{
					label: "Add payment",
					onClick: onAddPayment,
				},
				{
					label: "Add discount / adjustment",
					onClick: onAddAdjustment,
				},
				{
					label: showTransactions
						? "Hide transactions"
						: `View transactions (${transactionsCount})`,
					onClick: onToggleTransactions,
					disabled: transactionsCount === 0,
				},
			]}
		/>
	);
}

function TransactionList({
	player,
	transactions,
	activeSeasonId,
	onRemovePayment,
}: {
	player: Player;
	transactions: DisplayTransaction[];
	activeSeasonId: string;
	onRemovePayment: FinanceTableProps["onRemovePayment"];
}) {
	if (transactions.length === 0) {
		return (
			<p className="text-sm text-slate-500">
				No finance transactions recorded for this player yet.
			</p>
		);
	}

	return (
		<div className="space-y-2">
			{transactions.map((transaction) => (
				<div
					key={transaction.id}
					className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
				>
					<div>
						<div className="flex flex-wrap items-center gap-2">
							<StatusBadge
								label={transaction.type}
								tone={getTransactionBadgeTone(transaction.type)}
							/>
							<span className="font-semibold text-slate-800">
								{formatCurrency(transaction.amount)}
							</span>
							<span className="text-xs text-slate-500">
								{formatDateTime(transaction.date)}
							</span>
						</div>
						{transaction.note && (
							<p className="mt-1 text-sm text-slate-600">{transaction.note}</p>
						)}
					</div>

					<button
						type="button"
						onClick={() =>
							onRemovePayment(player.id, transaction.id, activeSeasonId, {
								playerName: player.name,
								amount: transaction.amount,
								type: transaction.type,
							})
						}
						className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
					>
						Remove
					</button>
				</div>
			))}
		</div>
	);
}

function useDisplayTransactions(record?: PlayerFinanceRecord) {
	return useMemo(() => {
		const transactions = record?.transactions ?? [];

		if (transactions.length > 0) {
			return transactions
				.map(toDisplayTransaction)
				.sort(sortTransactionsDescending);
		}

		return (record?.payments ?? [])
			.map((payment) => ({
				id: payment.id,
				type: "Payment" as const,
				amount: payment.amount,
				note: payment.note,
				date: payment.paidAt,
			}))
			.sort(sortTransactionsDescending);
	}, [record]);
}

function toDisplayTransaction(transaction: FinanceTransaction): DisplayTransaction {
	return {
		id: transaction.id,
		type: transaction.type,
		amount: transaction.amount,
		note: transaction.note,
		date: transaction.transactionDate,
	};
}

function sortTransactionsDescending(
	first: DisplayTransaction,
	second: DisplayTransaction
) {
	return new Date(second.date).getTime() - new Date(first.date).getTime();
}

function getTotalAdjustments(record?: PlayerFinanceRecord) {
	if (typeof record?.totalAdjustments === "number") {
		return record.totalAdjustments;
	}

	return (record?.transactions ?? [])
		.filter((transaction) => transaction.type === "Adjustment")
		.reduce((total, transaction) => total + transaction.amount, 0);
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

function getTransactionBadgeTone(type: string) {
	if (type === "Payment") {
		return "success";
	}

	if (type === "Adjustment") {
		return "warning";
	}

	return "info";
}
