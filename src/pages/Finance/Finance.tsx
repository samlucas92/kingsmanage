import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import ProgressBar from "../../components/compositions/ProgressBar";
import FilterButton from "../../components/compositions/FilterButton";
import PanelCard from "../../components/compositions/PanelCard";
import FinanceTable from "./components/FinanceTable";
import { formatCurrency } from "../../utils/format";

type AmountModalMode = "owed" | "payment" | "adjustment";
type BulkFinanceMode = AmountModalMode;

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

const primaryFinanceFilterOptions: Array<{
	label: string;
	value: FinanceFilter;
	getCount: (summary: ReturnType<typeof getFinanceSummary>, allRowsCount: number) => number;
}> = [
	{
		label: "Owing",
		value: "owed",
		getCount: (summary) => summary.playersOwingMoney.length,
	},
	{
		label: "Paid",
		value: "paid",
		getCount: (summary) => summary.paidPlayers.length,
	},
	{
		label: "All",
		value: "all",
		getCount: (_summary, allRowsCount) => allRowsCount,
	},
];

const secondaryFinanceFilterOptions: Array<{ label: string; value: FinanceFilter }> = [
	{ label: "Part paid", value: "part-paid" },
	{ label: "Unpaid", value: "unpaid" },
	{ label: "No charge", value: "nothing-owed" },
];

export default function Finance() {
	const [searchParams] = useSearchParams();
	const requestedSeasonId = searchParams.get("seasonId") ?? "";
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

	const [financeFilter, setFinanceFilter] = useState<FinanceFilter>(() => getInitialFinanceFilter(searchParams.get("status")));
	const [includeInactive, setIncludeInactive] = useState(false);
	const [amountModal, setAmountModal] = useState<AmountModalState | null>(null);
	const [deleteTransaction, setDeleteTransaction] =
		useState<DeleteTransactionState | null>(null);
	const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
	const [bulkMode, setBulkMode] = useState<BulkFinanceMode>("owed");
	const [bulkAmountValue, setBulkAmountValue] = useState("");
	const [bulkNote, setBulkNote] = useState("");
	const [bulkTarget, setBulkTarget] = useState<BulkTarget>("active");
	const [amountValue, setAmountValue] = useState("");
	const [paymentNote, setPaymentNote] = useState("");
	const [formError, setFormError] = useState("");
	const [bulkFormError, setBulkFormError] = useState("");
	const [deleteError, setDeleteError] = useState("");
	const [copyStatus, setCopyStatus] = useState("");
	const [isSavingFinance, setIsSavingFinance] = useState(false);
	const [selectedSeasonId, setSelectedSeasonId] = useState(requestedSeasonId);
	const [isPaymentPickerOpen, setIsPaymentPickerOpen] = useState(false);
	const [paymentPlayerId, setPaymentPlayerId] = useState("");

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

		// The available season list is loaded asynchronously and owns the valid selection set.
		// eslint-disable-next-line react-hooks/set-state-in-effect
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

	function openPaymentPicker() {
		setPaymentPlayerId(financeRows[0]?.player.id ?? allFinanceRows[0]?.player.id ?? "");
		setIsPaymentPickerOpen(true);
	}

	function confirmPaymentPlayer() {
		const player = players.find((item) => item.id === paymentPlayerId);
		if (!player) return;
		setIsPaymentPickerOpen(false);
		openAmountModal("payment", player);
	}

	function openBulkModal() {
		setBulkMode("owed");
		setBulkAmountValue("");
		setBulkNote("");
		setBulkTarget("active");
		setBulkFormError("");
		setIsBulkModalOpen(true);
	}

	function closeBulkModal() {
		setBulkMode("owed");
		setBulkAmountValue("");
		setBulkNote("");
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

		if (!Number.isFinite(amount)) {
			setBulkFormError("Amount must be a valid number.");
			return;
		}

		if (bulkMode !== "adjustment" && amount < 0) {
			setBulkFormError("Amount must be 0 or above.");
			return;
		}

		if (bulkMode === "payment" && amount <= 0) {
			setBulkFormError("Payment amount must be more than 0.");
			return;
		}

		if (bulkMode === "adjustment" && amount === 0) {
			setBulkFormError("Adjustment amount cannot be 0.");
			return;
		}

		if (bulkTargetRows.length === 0) {
			setBulkFormError("There are no players in this target group.");
			return;
		}

		const actionLabel =
			bulkMode === "owed"
				? "Set amount owed to"
				: bulkMode === "payment"
					? "Add payment of"
					: "Add adjustment of";

		const confirmed = window.confirm(
			`${actionLabel} ${formatCurrency(amount)} for ${
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
				if (bulkMode === "owed") {
					await setPlayerAmountOwed(row.player.id, amount, selectedSeasonId);
				} else if (bulkMode === "payment") {
					await addPlayerPayment(
						row.player.id,
						{
							amount,
							note: bulkNote.trim() || undefined,
						},
						selectedSeasonId
					);
				} else {
					await addPlayerAdjustment(
						row.player.id,
						{
							amount,
							note: bulkNote.trim() || undefined,
						},
						selectedSeasonId
					);
				}
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
			<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<h1 className="text-3xl font-bold text-blue-950">Finance</h1>
					<p className="mt-1 max-w-3xl text-sm text-slate-600">
						See what is still to collect and act on player balances quickly.
					</p>
				</div>

				<div className="flex flex-wrap items-end gap-2">
					<SeasonSelector
						label="Filter season"
						selectedSeasonId={selectedSeasonId}
						onSeasonChange={setSelectedSeasonId}
					/>
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

			<PanelCard>
				<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
					<div>
						<p className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Still to collect</p>
						<p className={`mt-1 text-4xl font-black tracking-tight ${financeSummary.totalOutstanding > 0 ? "text-red-700" : "text-yepset-700"}`}>
							{formatCurrency(financeSummary.totalOutstanding)}
						</p>
						<p className="mt-2 text-sm font-semibold text-slate-600">
							{formatCurrency(financeSummary.totalPaid)} of {formatCurrency(financeSummary.totalExpected)} collected · {Math.min(100, financeSummary.paidPercentage)}%
						</p>
						<ProgressBar value={financeSummary.totalPaid} max={financeSummary.totalExpected || 1} tone="success" heightClassName="h-2.5" className="mt-3" />
					</div>
					<div className="rounded-2xl bg-slate-50 p-4">
						<p className="text-lg font-black text-slate-950">{financeSummary.playersOwingCount} players owe money</p>
						<p className="mt-1 text-sm font-semibold text-slate-500">
							{financeSummary.partPaidPlayers.length} part-paid · {financeSummary.unpaidPlayers.length} unpaid
						</p>
					</div>
				</div>
			</PanelCard>

			<div className="grid grid-cols-3 gap-2">
				<QuickAction label="Record payment" tone="primary" disabled={!hasSelectedSeason || allFinanceRows.length === 0} onClick={openPaymentPicker} />
				<QuickAction label="Bulk update" disabled={!hasSelectedSeason || isSavingFinance} onClick={openBulkModal} />
				<details className="relative">
					<summary className="flex min-h-12 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50">Export</summary>
					<div className="absolute right-0 z-20 mt-2 w-64 space-y-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
						<button type="button" onClick={handleCopyTable} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50">Copy visible players</button>
						<button type="button" onClick={handleExportCsv} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50">Export summary CSV</button>
						<button type="button" onClick={handleExportTransactionsCsv} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50">Export transactions CSV</button>
						{copyStatus && <p className="px-3 py-1 text-xs font-bold text-yepset-700">{copyStatus}</p>}
					</div>
				</details>
			</div>

			<PanelCard
				title="Players"
				description="Owing is selected by default so the people needing attention appear first."
			>
				<div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex flex-wrap gap-2">
						{primaryFinanceFilterOptions.map((option) => (
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

					<details className="relative">
						<summary className="cursor-pointer list-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700">Filters{isSecondaryFilter(financeFilter) || includeInactive ? " · Active" : ""}</summary>
						<div className="absolute right-0 z-20 mt-2 w-56 space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
							<p className="text-xs font-black uppercase tracking-wide text-slate-400">Payment status</p>
							{secondaryFinanceFilterOptions.map((option) => (
								<button key={option.value} type="button" onClick={() => setFinanceFilter(option.value)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${financeFilter === option.value ? "bg-blue-50 text-blue-800" : "hover:bg-slate-50"}`}>{option.label}</button>
							))}
							<label className="flex items-center gap-2 border-t border-slate-100 pt-3 text-sm font-semibold text-slate-700">
								<input type="checkbox" checked={includeInactive} onChange={(event) => setIncludeInactive(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
								Include inactive players
							</label>
						</div>
					</details>
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
				title="Record payment"
				isOpen={isPaymentPickerOpen}
				confirmText="Continue"
				onClose={() => setIsPaymentPickerOpen(false)}
				onConfirm={confirmPaymentPlayer}
			>
				<label className="block text-sm font-semibold text-slate-700">
					Player
					<select value={paymentPlayerId} onChange={(event) => setPaymentPlayerId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">
						{allFinanceRows.map((row) => (
							<option key={row.player.id} value={row.player.id}>{row.player.name} · {formatCurrency(row.balance)} due</option>
						))}
					</select>
				</label>
			</Modal>

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
				title="Bulk update finance"
				isOpen={isBulkModalOpen}
				confirmText={isSavingFinance ? "Saving..." : getBulkConfirmText(bulkMode)}
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
						This applies the selected finance action to the chosen group in{" "}
						{selectedSeason?.name ?? "the filtered season"}.
					</p>

					<label className="block text-sm font-semibold text-slate-700">
						Action
						<select
							value={bulkMode}
							onChange={(event) => {
								setBulkMode(event.target.value as BulkFinanceMode);
								setBulkFormError("");
							}}
							className="mt-1 w-full rounded-lg border px-3 py-2"
						>
							<option value="owed">Set amount owed</option>
							<option value="payment">Add payment</option>
							<option value="adjustment">Add adjustment / discount</option>
						</select>
					</label>

					<label className="block text-sm font-semibold text-slate-700">
						Amount
						<input
							type="number"
							step="0.01"
							value={bulkAmountValue}
							onChange={(event) => {
								setBulkAmountValue(event.target.value);
								setBulkFormError("");
							}}
							className="mt-1 w-full rounded-lg border px-3 py-2"
							placeholder={bulkMode === "adjustment" ? "e.g. -5.00" : "0.00"}
						/>
					</label>

					{bulkMode !== "owed" && (
						<label className="block text-sm font-semibold text-slate-700">
							Note
							<input
								type="text"
								value={bulkNote}
								onChange={(event) => setBulkNote(event.target.value)}
								className="mt-1 w-full rounded-lg border px-3 py-2"
								placeholder={
									bulkMode === "adjustment"
										? "e.g. sibling discount"
										: "e.g. bank transfer batch"
								}
							/>
						</label>
					)}

					{bulkMode === "owed" && (
						<p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
							This sets the season charge for each selected player. Existing
							payments remain in place.
						</p>
					)}

					{bulkMode === "adjustment" && (
						<p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
							Use a negative amount for a discount or credit. Use a positive
							amount for a correction that increases the balance.
						</p>
					)}

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

function QuickAction({ label, onClick, disabled, tone = "default" }: { label: string; onClick: () => void; disabled?: boolean; tone?: "default" | "primary" }) {
	return (
		<button type="button" onClick={onClick} disabled={disabled} className={`min-h-12 rounded-xl px-3 text-sm font-black shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${tone === "primary" ? "bg-yepset-700 text-white hover:bg-yepset-800" : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"}`}>
			{label}
		</button>
	);
}

function getInitialFinanceFilter(value: string | null): FinanceFilter {
	return value === "paid" || value === "part-paid" || value === "unpaid" || value === "nothing-owed" || value === "all" ? value : "owed";
}

function isSecondaryFilter(value: FinanceFilter) {
	return value === "part-paid" || value === "unpaid" || value === "nothing-owed";
}

function getBulkConfirmText(mode: BulkFinanceMode) {
	if (mode === "payment") {
		return "Add Payments";
	}

	if (mode === "adjustment") {
		return "Add Adjustments";
	}

	return "Set Amounts";
}
