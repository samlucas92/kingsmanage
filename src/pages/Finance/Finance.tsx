import { useMemo, useState } from "react";
import { usePlayerStore } from "../../stores/players";
import { useFinanceStore } from "../../stores/finance";
import { useSeasonStore } from "../../stores/seasons";
import type { Player } from "../../stores/players";
import type { PlayerFinanceRecord } from "../../types/finance";
import {
	buildFinanceRows,
	filterFinanceRows,
	getBulkTargetRows,
	getFinanceExportColumns,
	getFinanceRecord,
	getFinanceSummary,
	getHighestOutstandingBalance,
	getTopOutstandingRows,
	type BulkTarget,
	type FinanceFilter,
} from "../../services/financeService";
import {
	buildCsvText,
	buildSeparatedTableText,
	downloadTextFile,
	slugify,
} from "../../services/exportService";
import EmptyState from "../../components/compositions/EmptyState";
import Modal from "../../components/compositions/Modal";
import SeasonSelector from "../../components/compositions/SeasonSelector";

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

	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);

	const [financeFilter, setFinanceFilter] = useState<FinanceFilter>("owed");
	const [includeInactive, setIncludeInactive] = useState(false);
	const [amountModal, setAmountModal] = useState<AmountModalState | null>(null);
	const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
	const [bulkAmountValue, setBulkAmountValue] = useState("");
	const [bulkTarget, setBulkTarget] = useState<BulkTarget>("active");
	const [amountValue, setAmountValue] = useState("");
	const [paymentNote, setPaymentNote] = useState("");
	const [formError, setFormError] = useState("");
	const [bulkFormError, setBulkFormError] = useState("");
	const [copyStatus, setCopyStatus] = useState("");

	const activeSeason = seasons.find((season) => season.id === activeSeasonId);
	const activeSeasonName = activeSeason?.name ?? "active-season";

	const allFinanceRows = useMemo(() => {
		return buildFinanceRows({
			players,
			playerFinanceRecords,
			seasonId: activeSeasonId,
			includeInactive,
		});
	}, [players, playerFinanceRecords, activeSeasonId, includeInactive]);

	const financeRows = useMemo(() => {
		return filterFinanceRows({
			rows: allFinanceRows,
			filter: financeFilter,
		});
	}, [allFinanceRows, financeFilter]);

	const financeSummary = useMemo(() => {
		return getFinanceSummary(allFinanceRows);
	}, [allFinanceRows]);

	const topOutstandingRows = useMemo(() => {
		return getTopOutstandingRows(allFinanceRows);
	}, [allFinanceRows]);

	const highestOutstanding = useMemo(() => {
		return getHighestOutstandingBalance(topOutstandingRows);
	}, [topOutstandingRows]);

	const bulkTargetRows = useMemo(() => {
		return getBulkTargetRows({
			bulkTarget,
			allRows: allFinanceRows,
			filteredRows: financeRows,
		});
	}, [bulkTarget, allFinanceRows, financeRows]);

	function openAmountModal(mode: AmountModalMode, player: Player) {
		const record = getFinanceRecord({
			records: playerFinanceRecords,
			playerId: player.id,
			seasonId: activeSeasonId,
		});

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

	function openBulkModal() {
		setBulkAmountValue("");
		setBulkTarget("active");
		setBulkFormError("");
		setIsBulkModalOpen(true);
	}

	function closeBulkModal() {
		setBulkAmountValue("");
		setBulkTarget("active");
		setBulkFormError("");
		setIsBulkModalOpen(false);
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
			setPlayerAmountOwed(amountModal.player.id, amount, activeSeasonId);
		} else {
			addPlayerPayment(
				amountModal.player.id,
				{
					amount,
					note: paymentNote.trim() || undefined,
				},
				activeSeasonId
			);
		}

		closeAmountModal();
	}

	function handleConfirmBulkAmount() {
		const amount = Number(bulkAmountValue);

		if (!Number.isFinite(amount) || amount < 0) {
			setBulkFormError("Amount must be 0 or above.");
			return;
		}

		if (bulkTargetRows.length === 0) {
			setBulkFormError("There are no players in this target group.");
			return;
		}

		const confirmed = window.confirm(
			`Set amount owed to ${formatMoney(amount)} for ${bulkTargetRows.length} ${
				bulkTargetRows.length === 1 ? "player" : "players"
			} in ${activeSeason?.name ?? "the active season"}?`
		);

		if (!confirmed) {
			return;
		}

		bulkTargetRows.forEach((row) => {
			setPlayerAmountOwed(row.player.id, amount, activeSeasonId);
		});

		closeBulkModal();
	}

	function handleCopyTable() {
		const exportColumns = getFinanceExportColumns();

		const tableText = buildSeparatedTableText({
			rows: financeRows,
			columns: exportColumns,
			separator: "\t",
		});

		navigator.clipboard
			.writeText(tableText)
			.then(() => {
				setCopyStatus("Copied");
				window.setTimeout(() => setCopyStatus(""), 2000);
			})
			.catch(() => {
				setCopyStatus("Copy failed");
				window.setTimeout(() => setCopyStatus(""), 2000);
			});
	}

	function handleExportCsv() {
		const exportColumns = getFinanceExportColumns();

		const csvText = buildCsvText({
			rows: financeRows,
			columns: exportColumns,
		});

		downloadTextFile({
			filename: `kingsbridge-colts-finance-${slugify(
				activeSeasonName
			)}-${financeFilter}.csv`,
			content: csvText,
			mimeType: "text/csv;charset=utf-8;",
		});
	}

	const modalTitle =
		amountModal?.mode === "owed" ? "Set amount owed" : "Add payment";

	const modalConfirmText =
		amountModal?.mode === "owed" ? "Save Amount" : "Add Payment";

	return (
		<div className="w-full min-w-0 space-y-6 overflow-hidden">
			<div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
				<div className="min-w-0">
					<h1 className="text-2xl font-bold text-blue-900">Finance</h1>

					<p className="text-gray-600">
						Track who has paid, who owes money, and total outstanding club
						payments for the active season.
					</p>
				</div>

				<div className="flex flex-wrap items-end gap-3">
					<button
						type="button"
						onClick={openBulkModal}
						className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
					>
						Bulk Set Owed
					</button>

					<SeasonSelector label="Active season" />
				</div>
			</div>

			<section className="rounded-xl bg-white p-5 shadow">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="min-w-0">
						<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
							Finance view
						</p>

						<h2 className="mt-1 text-lg font-bold text-slate-900">
							{activeSeason?.name ?? "No active season"}
						</h2>

						<p className="mt-1 text-sm text-slate-500">
							Amounts owed and payments are stored against this season. The
							default list only shows players with money outstanding.
						</p>
					</div>

					<div className="text-right">
						<p className="text-2xl font-bold text-blue-900">
							{financeSummary.paidPercentage}%
						</p>
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
							collected
						</p>
					</div>
				</div>

				<div className="mt-5">
					<div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
						<span>Paid {formatMoney(financeSummary.totalPaid)}</span>
						<span>
							Outstanding {formatMoney(financeSummary.totalOutstanding)}
						</span>
					</div>

					<div className="h-4 overflow-hidden rounded-full bg-red-100">
						<div
							className="h-full rounded-full bg-blue-700 transition-all"
							style={{
								width: `${Math.min(100, financeSummary.paidPercentage)}%`,
							}}
						/>
					</div>
				</div>
			</section>

			<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
				<FinanceStatCard
					label="Expected"
					value={formatMoney(financeSummary.totalExpected)}
					helper={`${allFinanceRows.length} visible players`}
				/>

				<FinanceStatCard
					label="Paid"
					value={formatMoney(financeSummary.totalPaid)}
					helper={`${financeSummary.paidPercentage}% collected`}
				/>

				<FinanceStatCard
					label="Outstanding"
					value={formatMoney(financeSummary.totalOutstanding)}
					helper={`${financeSummary.outstandingPercentage}% still owed`}
					warning={financeSummary.totalOutstanding > 0}
				/>

				<FinanceStatCard
					label="Players Owing"
					value={financeSummary.playersOwingMoney.length}
					helper={`${financeSummary.paidPlayers.length} fully paid`}
					warning={financeSummary.playersOwingMoney.length > 0}
				/>
			</div>

			<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
				<FinanceStatCard
					label="Average Owed"
					value={formatMoney(financeSummary.averageOwed)}
					helper="Per visible player"
				/>

				<FinanceStatCard
					label="Average Paid"
					value={formatMoney(financeSummary.averagePaid)}
					helper="Per visible player"
				/>

				<FinanceStatCard
					label="Part Paid"
					value={financeSummary.partPaidPlayers.length}
				/>

				<FinanceStatCard
					label="Unpaid"
					value={financeSummary.unpaidPlayers.length}
				/>
			</div>

			<div className="grid min-w-0 gap-6 xl:grid-cols-2">
				<section className="min-w-0 rounded-xl bg-white p-5 shadow">
					<div>
						<h2 className="text-lg font-bold text-blue-900">
							Payment Status
						</h2>

						<p className="mt-1 text-sm text-slate-500">
							Breakdown of players by payment state.
						</p>
					</div>

					<div className="mt-5 space-y-4">
						<StatusBar
							label="Paid"
							value={financeSummary.paidPlayers.length}
							total={allFinanceRows.length}
							tone="good"
						/>

						<StatusBar
							label="Part paid"
							value={financeSummary.partPaidPlayers.length}
							total={allFinanceRows.length}
							tone="warning"
						/>

						<StatusBar
							label="Unpaid"
							value={financeSummary.unpaidPlayers.length}
							total={allFinanceRows.length}
							tone="bad"
						/>

						<StatusBar
							label="Nothing owed"
							value={financeSummary.nothingOwedPlayers.length}
							total={allFinanceRows.length}
							tone="neutral"
						/>
					</div>
				</section>

				<section className="min-w-0 rounded-xl bg-white p-5 shadow">
					<div>
						<h2 className="text-lg font-bold text-blue-900">
							Top Outstanding
						</h2>

						<p className="mt-1 text-sm text-slate-500">
							Players with the highest active-season balance.
						</p>
					</div>

					{topOutstandingRows.length === 0 ? (
						<div className="mt-5 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-800">
							No outstanding balances for the current filter.
						</div>
					) : (
						<div className="mt-5 space-y-4">
							{topOutstandingRows.map((row) => (
								<OutstandingBar
									key={row.player.id}
									name={row.player.name}
									value={row.balance}
									maxValue={highestOutstanding}
								/>
							))}
						</div>
					)}
				</section>
			</div>

			<div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 className="text-sm font-bold text-blue-900">
							Bulk finance tools
						</h2>

						<p className="mt-1 text-sm text-blue-800">
							Set the same amount owed for a group of players in the active
							season.
						</p>
					</div>

					<button
						type="button"
						onClick={openBulkModal}
						className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
					>
						Bulk Set Owed
					</button>
				</div>
			</div>

			<div className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow">
				<FinanceFilterButton
					label="Owes Money"
					value="owed"
					count={financeSummary.playersOwingMoney.length}
					activeFilter={financeFilter}
					onChange={setFinanceFilter}
				/>

				<FinanceFilterButton
					label="Unpaid"
					value="unpaid"
					count={financeSummary.unpaidPlayers.length}
					activeFilter={financeFilter}
					onChange={setFinanceFilter}
				/>

				<FinanceFilterButton
					label="Part Paid"
					value="part-paid"
					count={financeSummary.partPaidPlayers.length}
					activeFilter={financeFilter}
					onChange={setFinanceFilter}
				/>

				<FinanceFilterButton
					label="Paid"
					value="paid"
					count={financeSummary.paidPlayers.length}
					activeFilter={financeFilter}
					onChange={setFinanceFilter}
				/>

				<FinanceFilterButton
					label="Nothing Owed"
					value="nothing-owed"
					count={financeSummary.nothingOwedPlayers.length}
					activeFilter={financeFilter}
					onChange={setFinanceFilter}
				/>

				<FinanceFilterButton
					label="All"
					value="all"
					count={allFinanceRows.length}
					activeFilter={financeFilter}
					onChange={setFinanceFilter}
				/>

				<label className="ml-auto flex items-center gap-2 text-sm font-medium text-slate-700">
					<input
						type="checkbox"
						checked={includeInactive}
						onChange={(event) => setIncludeInactive(event.target.checked)}
					/>
					Include inactive players
				</label>

				<div className="flex flex-wrap items-center gap-2">
					{copyStatus && (
						<span className="text-xs font-semibold text-slate-500">
							{copyStatus}
						</span>
					)}

					<button
						type="button"
						onClick={handleCopyTable}
						disabled={financeRows.length === 0}
						className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Copy table
					</button>

					<button
						type="button"
						onClick={handleExportCsv}
						disabled={financeRows.length === 0}
						className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Export CSV
					</button>
				</div>
			</div>

			<div className="min-w-0 overflow-hidden rounded-xl bg-white shadow">
				{financeRows.length === 0 ? (
					<div className="p-6">
						<EmptyState
							title="No finance records found"
							message="No players match this finance filter for the active season."
						/>
					</div>
				) : (
					<div className="max-w-full overflow-x-auto">
						<table className="min-w-[900px] text-sm">
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
										onAddPayment={() =>
											openAmountModal("payment", row.player)
										}
										onRemovePayment={(paymentId) =>
											removePlayerPayment(
												row.player.id,
												paymentId,
												activeSeasonId
											)
										}
									/>
								))}
							</tbody>
						</table>
					</div>
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

			<Modal
				isOpen={isBulkModalOpen}
				title="Bulk set amount owed"
				confirmText="Apply Amount"
				onClose={closeBulkModal}
				onConfirm={handleConfirmBulkAmount}
			>
				<div className="space-y-4">
					{bulkFormError && (
						<div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
							{bulkFormError}
						</div>
					)}

					<div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
						This updates the amount owed for the selected group in{" "}
						<strong>{activeSeason?.name ?? "the active season"}</strong>. It
						does not remove existing payments.
					</div>

					<label className="block space-y-1">
						<span className="text-sm font-semibold text-slate-700">
							Amount owed
						</span>

						<input
							type="number"
							min={0}
							step="0.01"
							value={bulkAmountValue}
							onChange={(event) => {
								setBulkAmountValue(event.target.value);
								setBulkFormError("");
							}}
							className="w-full rounded-lg border px-3 py-2"
							placeholder="0.00"
						/>
					</label>

					<label className="block space-y-1">
						<span className="text-sm font-semibold text-slate-700">
							Apply to
						</span>

						<select
							value={bulkTarget}
							onChange={(event) =>
								setBulkTarget(event.target.value as BulkTarget)
							}
							className="w-full rounded-lg border px-3 py-2"
						>
							<option value="active">
								Active players only (
								{allFinanceRows.filter((row) => row.player.isActive).length})
							</option>
							<option value="visible">
								Visible players ({allFinanceRows.length})
							</option>
							<option value="filtered">
								Current filtered list ({financeRows.length})
							</option>
						</select>
					</label>

					<div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
						This will update{" "}
						<strong>
							{bulkTargetRows.length}{" "}
							{bulkTargetRows.length === 1 ? "player" : "players"}
						</strong>
						.
					</div>
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
	helper,
	warning = false,
}: {
	label: string;
	value: string | number;
	helper?: string;
	warning?: boolean;
}) {
	return (
		<div className="min-w-0 rounded-xl bg-white p-5 shadow">
			<p className="truncate text-sm font-medium text-gray-500">{label}</p>

			<p
				className={`mt-2 text-3xl font-bold ${
					warning ? "text-red-700" : "text-blue-900"
				}`}
			>
				{value}
			</p>

			{helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
		</div>
	);
}

function FinanceFilterButton({
	label,
	value,
	count,
	activeFilter,
	onChange,
}: {
	label: string;
	value: FinanceFilter;
	count: number;
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
			{label}{" "}
			<span
				className={
					activeFilter === value ? "text-blue-100" : "text-slate-400"
				}
			>
				{count}
			</span>
		</button>
	);
}

function StatusBar({
	label,
	value,
	total,
	tone,
}: {
	label: string;
	value: number;
	total: number;
	tone: "good" | "warning" | "bad" | "neutral";
}) {
	const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

	return (
		<div>
			<div className="mb-1 flex items-center justify-between gap-3 text-sm">
				<span className="font-semibold text-slate-700">{label}</span>
				<span className="text-slate-500">
					{value} · {percentage}%
				</span>
			</div>

			<div className="h-3 overflow-hidden rounded-full bg-slate-100">
				<div
					className={`h-full rounded-full ${getStatusBarClass(tone)}`}
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}

function OutstandingBar({
	name,
	value,
	maxValue,
}: {
	name: string;
	value: number;
	maxValue: number;
}) {
	const percentage = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;

	return (
		<div>
			<div className="mb-1 flex items-center justify-between gap-3 text-sm">
				<span className="min-w-0 truncate font-semibold text-slate-700">
					{name}
				</span>
				<span className="shrink-0 text-slate-500">{formatMoney(value)}</span>
			</div>

			<div className="h-3 overflow-hidden rounded-full bg-slate-100">
				<div
					className="h-full rounded-full bg-red-500"
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}

function getStatusBarClass(tone: "good" | "warning" | "bad" | "neutral") {
	if (tone === "good") {
		return "bg-green-500";
	}

	if (tone === "warning") {
		return "bg-amber-500";
	}

	if (tone === "bad") {
		return "bg-red-500";
	}

	return "bg-slate-400";
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

function formatMoney(value: number) {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: "GBP",
	}).format(value);
}