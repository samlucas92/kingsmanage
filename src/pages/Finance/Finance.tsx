import { useMemo, useState } from "react";
import { usePlayerStore } from "../../stores/players";
import { useFinanceStore } from "../../stores/finance";
import type { Player } from "../../stores/players";
import type { PlayerFinanceRecord } from "../../stores/finance";
import {
	getPlayerBalance,
	getPlayerPaymentStatus,
	getPlayerTotalPaid,
} from "../../services/financeService";
import EmptyState from "../../components/compositions/EmptyState";
import Modal from "../../components/compositions/Modal";

type FinanceFilter = "all" | "owed" | "paid" | "part-paid" | "unpaid";

type AmountModalMode = "owed" | "payment";

type AmountModalState = {
	mode: AmountModalMode;
	player: Player;
};

export default function Finance() {
	const players = usePlayerStore((state) => state.players);
	const playerFinanceRecords = useFinanceStore(
		(state) => state.playerFinanceRecords
	);
	const setPlayerAmountOwed = useFinanceStore(
		(state) => state.setPlayerAmountOwed
	);
	const addPlayerPayment = useFinanceStore((state) => state.addPlayerPayment);
	const removePlayerPayment = useFinanceStore(
		(state) => state.removePlayerPayment
	);

	const [financeFilter, setFinanceFilter] = useState<FinanceFilter>("all");
	const [includeInactive, setIncludeInactive] = useState(false);
	const [amountModal, setAmountModal] = useState<AmountModalState | null>(null);
	const [amountValue, setAmountValue] = useState("");
	const [paymentNote, setPaymentNote] = useState("");
	const [formError, setFormError] = useState("");

	const visiblePlayers = useMemo(() => {
		return players.filter((player) => includeInactive || player.isActive);
	}, [players, includeInactive]);

	const financeRows = useMemo(() => {
		return visiblePlayers
			.map((player) => {
				const record = getFinanceRecord(playerFinanceRecords, player.id);
				const amountOwed = record?.amountOwed ?? 0;
				const totalPaid = getPlayerTotalPaid(record);
				const balance = getPlayerBalance(record);
				const status = getPlayerPaymentStatus(record);

				return {
					player,
					record,
					amountOwed,
					totalPaid,
					balance,
					status,
				};
			})
			.filter((row) => {
				if (financeFilter === "all") {
					return true;
				}

				if (financeFilter === "owed") {
					return row.balance > 0;
				}

				return row.status === financeFilter;
			})
			.sort((firstRow, secondRow) => {
				if (secondRow.balance !== firstRow.balance) {
					return secondRow.balance - firstRow.balance;
				}

				return firstRow.player.name.localeCompare(secondRow.player.name);
			});
	}, [visiblePlayers, playerFinanceRecords, financeFilter]);

	const totalExpected = visiblePlayers.reduce((total, player) => {
		const record = getFinanceRecord(playerFinanceRecords, player.id);

		return total + (record?.amountOwed ?? 0);
	}, 0);

	const totalPaid = visiblePlayers.reduce((total, player) => {
		const record = getFinanceRecord(playerFinanceRecords, player.id);

		return total + getPlayerTotalPaid(record);
	}, 0);

	const totalOutstanding = visiblePlayers.reduce((total, player) => {
		const record = getFinanceRecord(playerFinanceRecords, player.id);

		return total + getPlayerBalance(record);
	}, 0);

	const playersOwingMoney = visiblePlayers.filter((player) => {
		const record = getFinanceRecord(playerFinanceRecords, player.id);

		return getPlayerBalance(record) > 0;
	});

	function openAmountModal(mode: AmountModalMode, player: Player) {
		const record = getFinanceRecord(playerFinanceRecords, player.id);

		setAmountModal({
			mode,
			player,
		});

		setAmountValue(mode === "owed" ? String(record?.amountOwed ?? "") : "");
		setPaymentNote("");
		setFormError("");
	}

	function closeAmountModal() {
		setAmountModal(null);
		setAmountValue("");
		setPaymentNote("");
		setFormError("");
	}

	function handleConfirmAmountModal() {
		if (!amountModal) {
			return;
		}

		const amount = Number(amountValue);

		if (!Number.isFinite(amount) || amount < 0) {
			setFormError("Amount must be 0 or above.");
			return;
		}

		if (amountModal.mode === "payment" && amount <= 0) {
			setFormError("Payment amount must be more than 0.");
			return;
		}

		if (amountModal.mode === "owed") {
			setPlayerAmountOwed(amountModal.player.id, amount);
		} else {
			addPlayerPayment(amountModal.player.id, {
				amount,
				note: paymentNote.trim() || undefined,
			});
		}

		closeAmountModal();
	}

	const modalTitle =
		amountModal?.mode === "owed" ? "Set amount owed" : "Add payment";

	const modalConfirmText =
		amountModal?.mode === "owed" ? "Save Amount" : "Add Payment";

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-blue-900">Finance</h1>

					<p className="text-gray-600">
						Track who has paid, who owes money, and total outstanding club
						payments.
					</p>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<FinanceStatCard label="Expected" value={formatMoney(totalExpected)} />
				<FinanceStatCard label="Paid" value={formatMoney(totalPaid)} />
				<FinanceStatCard
					label="Outstanding"
					value={formatMoney(totalOutstanding)}
				/>
				<FinanceStatCard
					label="Players Owing"
					value={playersOwingMoney.length}
				/>
			</div>

			<div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow">
				<FinanceFilterButton
					label="All"
					value="all"
					activeFilter={financeFilter}
					onChange={setFinanceFilter}
				/>

				<FinanceFilterButton
					label="Owes Money"
					value="owed"
					activeFilter={financeFilter}
					onChange={setFinanceFilter}
				/>

				<FinanceFilterButton
					label="Unpaid"
					value="unpaid"
					activeFilter={financeFilter}
					onChange={setFinanceFilter}
				/>

				<FinanceFilterButton
					label="Part Paid"
					value="part-paid"
					activeFilter={financeFilter}
					onChange={setFinanceFilter}
				/>

				<FinanceFilterButton
					label="Paid"
					value="paid"
					activeFilter={financeFilter}
					onChange={setFinanceFilter}
				/>

				<label className="ml-auto flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={includeInactive}
						onChange={(event) => setIncludeInactive(event.target.checked)}
					/>
					Include inactive players
				</label>
			</div>

			<div className="overflow-hidden rounded-xl bg-white shadow">
				{financeRows.length === 0 ? (
					<div className="p-6">
						<EmptyState
							title="No finance records found"
							message="No players match this finance filter yet."
						/>
					</div>
				) : (
					<table className="w-full text-sm">
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
							{financeRows.map((row) => (
								<FinanceRow
									key={row.player.id}
									player={row.player}
									record={row.record}
									amountOwed={row.amountOwed}
									totalPaid={row.totalPaid}
									balance={row.balance}
									status={row.status}
									onSetOwed={() => openAmountModal("owed", row.player)}
									onAddPayment={() => openAmountModal("payment", row.player)}
									onRemovePayment={(paymentId) =>
										removePlayerPayment(row.player.id, paymentId)
									}
								/>
							))}
						</tbody>
					</table>
				)}
			</div>

			<Modal
				isOpen={amountModal !== null}
				title={
					amountModal
						? `${modalTitle}: ${amountModal.player.name}`
						: modalTitle
				}
				confirmText={modalConfirmText}
				onClose={closeAmountModal}
				onConfirm={handleConfirmAmountModal}
			>
				<div className="space-y-4">
					{formError && (
						<div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
							{formError}
						</div>
					)}

					<label className="block space-y-1">
						<span className="text-sm font-semibold text-slate-700">
							Amount
						</span>

						<input
							type="number"
							min={0}
							step="0.01"
							value={amountValue}
							onChange={(event) => {
								setAmountValue(event.target.value);
								setFormError("");
							}}
							className="w-full rounded-lg border px-3 py-2"
							placeholder="0.00"
						/>
					</label>

					{amountModal?.mode === "payment" && (
						<label className="block space-y-1">
							<span className="text-sm font-semibold text-slate-700">
								Note
							</span>

							<input
								value={paymentNote}
								onChange={(event) => setPaymentNote(event.target.value)}
								className="w-full rounded-lg border px-3 py-2"
								placeholder="e.g. subs, fines, kit money"
							/>
						</label>
					)}
				</div>
			</Modal>
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
	onSetOwed: () => void;
	onAddPayment: () => void;
	onRemovePayment: (paymentId: string) => void;
}) {
	const [showPayments, setShowPayments] = useState(false);

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

				<td className="p-3">{formatMoney(amountOwed)}</td>
				<td className="p-3">{formatMoney(totalPaid)}</td>

				<td className="p-3 font-semibold">
					<span className={balance > 0 ? "text-red-700" : "text-green-700"}>
						{formatMoney(balance)}
					</span>
				</td>

				<td className="p-3">
					<FinanceStatusBadge status={status} />
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
												{formatMoney(payment.amount)}
											</p>

											<p className="text-xs text-slate-500">
												{new Date(payment.paidAt).toLocaleString()}
												{payment.note ? ` · ${payment.note}` : ""}
											</p>
										</div>

										<button
											type="button"
											onClick={() => onRemovePayment(payment.id)}
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

function FinanceStatCard({
	label,
	value,
}: {
	label: string;
	value: string | number;
}) {
	return (
		<div className="rounded-xl bg-white p-5 shadow">
			<p className="text-sm font-medium text-gray-500">{label}</p>
			<p className="mt-2 text-3xl font-bold text-blue-900">{value}</p>
		</div>
	);
}

function FinanceFilterButton({
	label,
	value,
	activeFilter,
	onChange,
}: {
	label: string;
	value: FinanceFilter;
	activeFilter: FinanceFilter;
	onChange: (value: FinanceFilter) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onChange(value)}
			className={`rounded-full border px-4 py-2 text-sm font-semibold ${
				activeFilter === value
					? "border-blue-700 bg-blue-700 text-white"
					: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
			}`}
		>
			{label}
		</button>
	);
}

function FinanceStatusBadge({ status }: { status: string }) {
	if (status === "paid") {
		return (
			<span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
				Paid
			</span>
		);
	}

	if (status === "part-paid") {
		return (
			<span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
				Part paid
			</span>
		);
	}

	if (status === "unpaid") {
		return (
			<span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
				Unpaid
			</span>
		);
	}

	return (
		<span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
			Nothing owed
		</span>
	);
}

function getFinanceRecord(
	records: PlayerFinanceRecord[],
	playerId: string
) {
	return records.find((record) => record.playerId === playerId);
}

function formatMoney(value: number) {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: "GBP",
	}).format(value);
}