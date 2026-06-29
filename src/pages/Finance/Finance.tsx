import { useEffect, useMemo, useState } from "react";
import { usePlayerStore } from "../../stores/players";
import { useFinanceStore } from "../../stores/finance";
import { useSeasonStore } from "../../stores/seasons";
import type { Player } from "../../stores/players";
import {
	buildFinanceRows,
	filterFinanceRows,
	getBulkTargetRows,
	getFinanceExportColumns,
	getFinanceRecord,
	getFinanceTransactionExportColumns,
	getFinanceTransactionExportRows,
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
import Modal from "../../components/compositions/Modal";
import SeasonSelector from "../../components/compositions/SeasonSelector";
import MetricCard from "../../components/compositions/MetricCard";
import ProgressBar from "../../components/compositions/ProgressBar";
import FilterButton from "../../components/compositions/FilterButton";
import PanelCard from "../../components/compositions/PanelCard";
import FinanceTable from "./components/FinanceTable";
import { formatCurrency } from "../../utils/format";

type AmountModalMode = "owed" | "payment" | "adjustment";

type AmountModalState = {
	mode: AmountModalMode;
	player: Player;
};

type DeleteTransactionState = {
	playerId: string;
	transactionId: string;
	playerName: string;
	amount: number;
	type: string;
};

const financeFilterOptions: Array<{
	label: string;
	value: FinanceFilter;
	getCount: (summary: ReturnType<typeof getFinanceSummary>, allRowsCount: number) => number;
}> = [
	{
		label: "Owes money",
		value: "owed",
		getCount: (summary) => summary.playersOwingMoney.length,
	},
	{
		label: "Paid in full",
		value: "paid",
		getCount: (summary) => summary.paidPlayers.length,
	},
	{
		label: "Part paid",
		value: "part-paid",
		getCount: (summary) => summary.partPaidPlayers.length,
	},
	{
		label: "Unpaid",
		value: "unpaid",
		getCount: (summary) => summary.unpaidPlayers.length,
	},
	{
		label: "No charge",
		value: "nothing-owed",
		getCount: (summary) => summary.nothingOwedPlayers.length,
	},
	{
		label: "All",
		value: "all",
		getCount: (_summary, allRowsCount) => allRowsCount,
	},
];

export default function Finance() {
	const players = usePlayerStore((state) => state.players);
	const loadPlayers = usePlayerStore((state) => state.loadPlayers);
	const isLoadingPlayers = usePlayerStore((state) => state.isLoadingPlayers);
	const playerLoadError = usePlayerStore((state) => state.playerLoadError);

	const playerFinanceRecords = useFinanceStore(
		(state) => state.playerFinanceRecords
	);
	const isLoadingFinance = useFinanceStore((state) => state.isLoadingFinance);
	const financeLoadError = useFinanceStore((state) => state.financeLoadError);
	const loadFinance = useFinanceStore((state) => state.loadFinance);
	const setPlayerAmountOwed = useFinanceStore(
		(state) => state.setPlayerAmountOwed
	);
	const addPlayerPayment = useFinanceStore((state) => state.addPlayerPayment);
	const addPlayerAdjustment = useFinanceStore(
		(state) => state.addPlayerAdjustment
	);
	const removePlayerPayment = useFinanceStore(
		(state) => state.removePlayerPayment
	);

	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);
	const isLoadingSeasons = useSeasonStore((state) => state.isLoadingSeasons);
	const seasonLoadError = useSeasonStore((state) => state.seasonLoadError);

	const [financeFilter, setFinanceFilter] = useState<FinanceFilter>("owed");
	const [includeInactive, setIncludeInactive] = useState(false);
	const [amountModal, setAmountModal] = useState<AmountModalState | null>(null);
	const [deleteTransaction, setDeleteTransaction] =
		useState<DeleteTransactionState | null>(null);
	const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
	const [bulkAmountValue, setBulkAmountValue] = useState("");
	const [bulkTarget, setBulkTarget] = useState<BulkTarget>("active");
	const [amountValue, setAmountValue] = useState("");
	const [paymentNote, setPaymentNote] = useState("");
	const [formError, setFormError] = useState("");
	const [bulkFormError, setBulkFormError] = useState("");
	const [deleteError, setDeleteError] = useState("");
	const [copyStatus, setCopyStatus] = useState("");
	const [isSavingFinance, setIsSavingFinance] = useState(false);
	const [selectedSeasonId, setSelectedSeasonId] = useState("");

	useEffect(() => {
		void loadPlayers(true);
	}, [loadPlayers]);

	useEffect(() => {
		void loadSeasons();
	}, [loadSeasons]);

	useEffect(() => {
		if (selectedSeasonId && seasons.some((season) => season.id === selectedSeasonId)) {
			return;
		}

		setSelectedSeasonId(activeSeasonId || seasons[0]?.id || "");
	}, [activeSeasonId, seasons, selectedSeasonId]);

	useEffect(() => {
		if (!selectedSeasonId) {
			return;
		}

		void loadFinance(selectedSeasonId, true);
	}, [selectedSeasonId, loadFinance]);

	const selectedSeason = seasons.find((season) => season.id === selectedSeasonId);
	const selectedSeasonName = selectedSeason?.name ?? "selected-season";
	const hasSelectedSeason = Boolean(selectedSeasonId);
	const isInitialLoading =
		(isLoadingPlayers && players.length === 0) ||
		(isLoadingSeasons && seasons.length === 0) ||
		(isLoadingFinance && playerFinanceRecords.length === 0);

	const allFinanceRows = useMemo(() => {
		if (!selectedSeasonId) {
			return [];
		}

		return buildFinanceRows({
			players,
			playerFinanceRecords,
			seasonId: selectedSeasonId,
			includeInactive,
		});
	}, [players, playerFinanceRecords, selectedSeasonId, includeInactive]);

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
			seasonId: selectedSeasonId,
		});

		setAmountModal({ mode, player });
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

	function openDeleteTransactionModal(details: DeleteTransactionState) {
		setDeleteTransaction(details);
		setDeleteError("");
	}

	function closeDeleteTransactionModal() {
		setDeleteTransaction(null);
		setDeleteError("");
	}

	async function handleConfirmAmountModal() {
		if (!amountModal || isSavingFinance) {
			return;
		}

		if (!selectedSeasonId) {
			setFormError("Select a season before saving finance records.");
			return;
		}

		const amount = Number(amountValue);

		if (!Number.isFinite(amount)) {
			setFormError("Amount must be a valid number.");
			return;
		}

		if (amountModal.mode !== "adjustment" && amount < 0) {
			setFormError("Amount must be 0 or above.");
			return;
		}

		if (amountModal.mode === "payment" && amount <= 0) {
			setFormError("Payment amount must be more than 0.");
			return;
		}

		if (amountModal.mode === "adjustment" && amount === 0) {
			setFormError("Adjustment amount cannot be 0.");
			return;
		}

		try {
			setIsSavingFinance(true);

			if (amountModal.mode === "owed") {
				await setPlayerAmountOwed(amountModal.player.id, amount, selectedSeasonId);
			} else if (amountModal.mode === "payment") {
				await addPlayerPayment(
					amountModal.player.id,
					{
						amount,
						note: paymentNote.trim() || undefined,
					},
					selectedSeasonId
				);
			} else {
				await addPlayerAdjustment(
					amountModal.player.id,
					{
						amount,
						note: paymentNote.trim() || undefined,
					},
					selectedSeasonId
				);
			}

			closeAmountModal();
		} catch (error) {
			setFormError(
				error instanceof Error
					? error.message
					: "Finance record could not be saved."
			);
		} finally {
			setIsSavingFinance(false);
		}
	}

	async function handleConfirmBulkAmount() {
		if (!selectedSeasonId) {
			setBulkFormError("Select a season before saving finance records.");
			return;
		}

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
			`Set amount owed to ${formatCurrency(amount)} for ${
				bulkTargetRows.length
			} ${bulkTargetRows.length === 1 ? "player" : "players"} in ${
				selectedSeason?.name ?? "the filtered season"
			}?`
		);

		if (!confirmed) {
			return;
		}

		try {
			setIsSavingFinance(true);
			setBulkFormError("");

			for (const row of bulkTargetRows) {
				await setPlayerAmountOwed(row.player.id, amount, selectedSeasonId);
			}

			closeBulkModal();
		} catch (error) {
			setBulkFormError(
				error instanceof Error
					? error.message
					: "Bulk finance update could not be completed."
			);
		} finally {
			setIsSavingFinance(false);
		}
	}

	async function handleConfirmDeleteTransaction() {
		if (!deleteTransaction || isSavingFinance || !selectedSeasonId) {
			return;
		}

		try {
			setIsSavingFinance(true);
			setDeleteError("");
			await removePlayerPayment(
				deleteTransaction.playerId,
				deleteTransaction.transactionId,
				selectedSeasonId
			);
			closeDeleteTransactionModal();
		} catch (error) {
			setDeleteError(
				error instanceof Error
					? error.message
					: "Transaction could not be removed."
			);
		} finally {
			setIsSavingFinance(false);
		}
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
			filename: `kingsbridge-colts-finance-summary-${slugify(
				selectedSeasonName
			)}-${financeFilter}.csv`,
			content: csvText,
			mimeType: "text/csv;charset=utf-8;",
		});
	}

	function handleExportTransactionsCsv() {
		const transactionRows = getFinanceTransactionExportRows(financeRows);
		const exportColumns = getFinanceTransactionExportColumns();
		const csvText = buildCsvText({
			rows: transactionRows,
			columns: exportColumns,
		});

		downloadTextFile({
			filename: `kingsbridge-colts-finance-transactions-${slugify(
				selectedSeasonName
			)}-${financeFilter}.csv`,
			content: csvText,
			mimeType: "text/csv;charset=utf-8;",
		});
	}

	const modalTitle =
		amountModal?.mode === "owed"
			? "Set amount owed"
			: amountModal?.mode === "payment"
				? "Add payment"
				: "Add discount / adjustment";

	const modalConfirmText =
		amountModal?.mode === "owed"
			? "Save Amount"
			: amountModal?.mode === "payment"
				? "Add Payment"
				: "Add Adjustment";

	return (
		<div className="space-y-3 lg:space-y-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="hidden lg:block">
					<h1 className="text-3xl font-bold text-blue-950">Finance</h1>
					<p className="mt-1 max-w-3xl text-sm text-slate-600">
						Track who has paid, who owes money, and total outstanding club
						payments for the filtered season.
					</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<SeasonSelector
						label="Filter season"
						selectedSeasonId={selectedSeasonId}
						onSeasonChange={setSelectedSeasonId}
					/>
					<button
						type="button"
						onClick={openBulkModal}
						disabled={!hasSelectedSeason || isSavingFinance}
						className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Bulk Set Owed
					</button>
				</div>
			</div>

			{(playerLoadError || seasonLoadError || financeLoadError) && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{playerLoadError || seasonLoadError || financeLoadError}
				</div>
			)}

			{isInitialLoading && (
				<div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
					Loading finance records...
				</div>
			)}

			{!hasSelectedSeason && !isInitialLoading && (
				<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
					No season is selected. Create or select a season before
					managing finance.
				</div>
			)}

			<PanelCard
				className="hidden lg:block"
				title={selectedSeason?.name ?? "No season selected"}
				description="Amounts owed, payments, and adjustments are filtered by this season."
			>
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<MetricCard
						label="Expected"
						value={formatCurrency(financeSummary.totalExpected)}
						helper="Charges minus discounts"
					/>
					<MetricCard
						label="Paid"
						value={formatCurrency(financeSummary.totalPaid)}
						tone="success"
						helper={`${financeSummary.paidPercentage}% collected`}
					/>
					<MetricCard
						label="Outstanding"
						value={formatCurrency(financeSummary.totalOutstanding)}
						tone={financeSummary.totalOutstanding > 0 ? "danger" : "success"}
						helper={`${financeSummary.playersOwingMoney.length} players owing`}
					/>
					<MetricCard
						label="Average owed"
						value={formatCurrency(financeSummary.averageOwed)}
						helper="Across visible players"
					/>
				</div>

				<div className="mt-5 space-y-2">
					<div className="flex items-center justify-between text-sm font-semibold text-slate-700">
						<span>{financeSummary.paidPercentage}% collected</span>
						<span>
							Paid {formatCurrency(financeSummary.totalPaid)} · Outstanding{" "}
							{formatCurrency(financeSummary.totalOutstanding)}
						</span>
					</div>
					<ProgressBar
						value={financeSummary.totalPaid}
						max={financeSummary.totalExpected || 1}
						tone={financeSummary.totalOutstanding > 0 ? "warning" : "success"}
					/>
				</div>
			</PanelCard>

			<PanelCard className="hidden lg:block" title="Top outstanding">
				{topOutstandingRows.length === 0 ? (
					<p className="text-sm text-slate-500">
						No outstanding balances for the current filter.
					</p>
				) : (
					<div className="space-y-3">
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
			</PanelCard>

			<PanelCard
				title="Finance records"
				description="Use filters to focus on money owed, paid players, unpaid players, or players with no charge."
				action={
					<div className="hidden flex-wrap gap-2 lg:flex">
						{copyStatus && (
							<span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
								{copyStatus}
							</span>
						)}
						<button
							type="button"
							onClick={handleCopyTable}
							className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
						>
							Copy table
						</button>
						<button
							type="button"
							onClick={handleExportCsv}
							className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
						>
							Export summary CSV
						</button>
						<button
							type="button"
							onClick={handleExportTransactionsCsv}
							className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
						>
							Export transactions CSV
						</button>
					</div>
				}
			>
				<div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex flex-wrap gap-2">
						{financeFilterOptions.map((option) => (
							<FilterButton
								key={option.value}
								label={option.label}
								value={option.value}
								activeValue={financeFilter}
								onChange={(value) => setFinanceFilter(value as FinanceFilter)}
								count={option.getCount(financeSummary, allFinanceRows.length)}
							/>
						))}
					</div>

					<label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
						<input
							type="checkbox"
							checked={includeInactive}
							onChange={(event) => setIncludeInactive(event.target.checked)}
							className="h-4 w-4 rounded border-slate-300"
						/>
						Include inactive players
					</label>
				</div>

				<FinanceTable
					rows={financeRows}
					activeSeasonId={selectedSeasonId}
					onSetOwed={(player) => openAmountModal("owed", player)}
					onAddPayment={(player) => openAmountModal("payment", player)}
					onAddAdjustment={(player) => openAmountModal("adjustment", player)}
					onRemovePayment={(playerId, transactionId, _seasonId, details) =>
						openDeleteTransactionModal({
							playerId,
							transactionId,
							playerName: details.playerName,
							amount: details.amount,
							type: details.type,
						})
					}
				/>
			</PanelCard>

			<Modal
				title={modalTitle}
				isOpen={Boolean(amountModal)}
				confirmText={isSavingFinance ? "Saving..." : modalConfirmText}
				onClose={closeAmountModal}
				onConfirm={handleConfirmAmountModal}
			>
				<div className="space-y-4">
					{formError && (
						<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
							{formError}
						</div>
					)}

					<label className="block text-sm font-semibold text-slate-700">
						Amount
						<input
							type="number"
							step="0.01"
							value={amountValue}
							onChange={(event) => {
								setAmountValue(event.target.value);
								setFormError("");
							}}
							className="mt-1 w-full rounded-lg border px-3 py-2"
							placeholder={
								amountModal?.mode === "adjustment" ? "e.g. -5.00" : "0.00"
							}
						/>
					</label>

					{amountModal?.mode !== "owed" && (
						<label className="block text-sm font-semibold text-slate-700">
							Note
							<input
								type="text"
								value={paymentNote}
								onChange={(event) => setPaymentNote(event.target.value)}
								className="mt-1 w-full rounded-lg border px-3 py-2"
								placeholder={
									amountModal?.mode === "adjustment"
										? "e.g. discount, correction"
										: "e.g. cash, bank transfer"
								}
							/>
						</label>
					)}

					{amountModal?.mode === "adjustment" && (
						<p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
							Use a negative amount for a discount or credit, for example
							-5. Use a positive amount for a correction that increases the
							balance.
						</p>
					)}
				</div>
			</Modal>

			<Modal
				title="Bulk set amount owed"
				isOpen={isBulkModalOpen}
				confirmText={isSavingFinance ? "Saving..." : "Set Amounts"}
				onClose={closeBulkModal}
				onConfirm={handleConfirmBulkAmount}
			>
				<div className="space-y-4">
					{bulkFormError && (
						<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
							{bulkFormError}
						</div>
					)}

					<p className="text-sm text-slate-600">
						This updates the amount owed for the selected group in{" "}
						{selectedSeason?.name ?? "the filtered season"}. It does not remove
						existing payments.
					</p>

					<label className="block text-sm font-semibold text-slate-700">
						Amount owed
						<input
							type="number"
							step="0.01"
							value={bulkAmountValue}
							onChange={(event) => {
								setBulkAmountValue(event.target.value);
								setBulkFormError("");
							}}
							className="mt-1 w-full rounded-lg border px-3 py-2"
							placeholder="0.00"
						/>
					</label>

					<label className="block text-sm font-semibold text-slate-700">
						Apply to
						<select
							value={bulkTarget}
							onChange={(event) =>
								setBulkTarget(event.target.value as BulkTarget)
							}
							className="mt-1 w-full rounded-lg border px-3 py-2"
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

					<p className="text-sm text-slate-500">
						This will update {bulkTargetRows.length}{" "}
						{bulkTargetRows.length === 1 ? "player" : "players"}.
					</p>
				</div>
			</Modal>

			<Modal
				title="Remove finance transaction?"
				isOpen={Boolean(deleteTransaction)}
				confirmText={isSavingFinance ? "Removing..." : "Remove Transaction"}
				onClose={closeDeleteTransactionModal}
				onConfirm={handleConfirmDeleteTransaction}
			>
				<div className="space-y-3">
					{deleteError && (
						<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
							{deleteError}
						</div>
					)}

					<p className="text-sm text-slate-600">
						Are you sure you want to remove this finance transaction? This
						will update the player&apos;s finance balance.
					</p>

					{deleteTransaction && (
						<div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
							<p className="font-semibold">{deleteTransaction.playerName}</p>
							<p>
								{deleteTransaction.type} · {formatCurrency(deleteTransaction.amount)}
							</p>
						</div>
					)}
				</div>
			</Modal>
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
			<div className="mb-1 flex items-center justify-between text-sm">
				<span className="font-semibold text-slate-700">{name}</span>
				<span className="font-semibold text-red-700">
					{formatCurrency(value)}
				</span>
			</div>
			<ProgressBar value={percentage} tone="danger" heightClassName="h-2" />
		</div>
	);
}
