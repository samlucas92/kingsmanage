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
	const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
	const [bulkAmountValue, setBulkAmountValue] = useState("");
	const [bulkTarget, setBulkTarget] = useState<BulkTarget>("active");
	const [amountValue, setAmountValue] = useState("");
	const [paymentNote, setPaymentNote] = useState("");
	const [formError, setFormError] = useState("");
	const [bulkFormError, setBulkFormError] = useState("");
	const [copyStatus, setCopyStatus] = useState("");
	const [isSavingFinance, setIsSavingFinance] = useState(false);

	useEffect(() => {
		void loadPlayers(true);
	}, [loadPlayers]);

	useEffect(() => {
		void loadSeasons();
	}, [loadSeasons]);

	useEffect(() => {
		if (!activeSeasonId) {
			return;
		}

		void loadFinance(activeSeasonId, true);
	}, [activeSeasonId, loadFinance]);

	const activeSeason = seasons.find((season) => season.id === activeSeasonId);
	const activeSeasonName = activeSeason?.name ?? "active-season";
	const isInitialLoading =
		(isLoadingPlayers && players.length === 0) ||
		(isLoadingSeasons && seasons.length === 0) ||
		(isLoadingFinance && playerFinanceRecords.length === 0);

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

	async function handleConfirmAmountModal() {
		if (!amountModal || isSavingFinance) {
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
				await setPlayerAmountOwed(
					amountModal.player.id,
					amount,
					activeSeasonId
				);
			} else if (amountModal.mode === "payment") {
				await addPlayerPayment(
					amountModal.player.id,
					{
						amount,
						note: paymentNote.trim() || undefined,
					},
					activeSeasonId
				);
			} else {
				await addPlayerAdjustment(
					amountModal.player.id,
					{
						amount,
						note: paymentNote.trim() || undefined,
					},
					activeSeasonId
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
				activeSeason?.name ?? "the active season"
			}?`
		);

		if (!confirmed) {
			return;
		}

		try {
			setIsSavingFinance(true);
			setBulkFormError("");

			for (const row of bulkTargetRows) {
				await setPlayerAmountOwed(row.player.id, amount, activeSeasonId);
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
		amountModal?.mode === "owed"
			? "Set amount owed"
			: amountModal?.mode === "payment"
				? "Add payment"
				: "Add adjustment";
	const modalConfirmText =
		amountModal?.mode === "owed"
			? "Save Amount"
			: amountModal?.mode === "payment"
				? "Add Payment"
				: "Add Adjustment";

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Finance</h1>
					<p className="mt-1 text-sm text-slate-500">
						Track who has paid, who owes money, and total outstanding club
						payments for the active season.
					</p>
				</div>
				<button
					type="button"
					onClick={openBulkModal}
					className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
				>
					Bulk Set Owed
				</button>
			</div>

			{(playerLoadError || seasonLoadError || financeLoadError) && (
				<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
					{playerLoadError || seasonLoadError || financeLoadError}
				</div>
			)}

			{isInitialLoading && (
				<div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
					Loading finance records...
				</div>
			)}

			<PanelCard
				title="Finance view"
				action={
					<SeasonSelector
						label="Finance season"
					/>
				}
			>
				<div className="space-y-4">
					<div>
						<h2 className="text-lg font-semibold text-slate-900">
							{activeSeason?.name ?? "No active season"}
						</h2>
						<p className="text-sm text-slate-500">
							Amounts owed and payments are stored against this season. The
							default list only shows players with money outstanding.
						</p>
					</div>

					<div className="grid gap-4 md:grid-cols-4">
						<MetricCard
							label="Expected"
							value={formatCurrency(financeSummary.totalExpected)}
						/>
						<MetricCard
							label="Paid"
							value={formatCurrency(financeSummary.totalPaid)}
							tone="success"
						/>
						<MetricCard
							label="Outstanding"
							value={formatCurrency(financeSummary.totalOutstanding)}
							tone={
								financeSummary.totalOutstanding > 0 ? "danger" : "success"
							}
						/>
						<MetricCard
							label="Players owing"
							value={financeSummary.playersOwingMoney.length}
							tone={
								financeSummary.playersOwingMoney.length > 0
									? "warning"
									: "success"
							}
						/>
					</div>

					<div className="grid gap-4 lg:grid-cols-[1fr_320px]">
						<div className="rounded-2xl border border-slate-200 bg-white p-4">
							<div className="flex items-center justify-between gap-4">
								<div>
									<p className="text-sm font-semibold text-slate-700">
										{financeSummary.paidPercentage}% collected
									</p>
									<p className="text-xs text-slate-500">
										Paid {formatCurrency(financeSummary.totalPaid)} ·
										Outstanding {formatCurrency(financeSummary.totalOutstanding)}
									</p>
								</div>
							</div>
							<div className="mt-4">
								<ProgressBar value={financeSummary.paidPercentage} />
							</div>
							<div className="mt-4 grid gap-3 sm:grid-cols-2">
								<StatusBar
									label="Paid players"
									value={financeSummary.paidPlayers.length}
									total={allFinanceRows.length}
									tone="success"
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
									tone="danger"
								/>
								<StatusBar
									label="Nothing owed"
									value={financeSummary.nothingOwedPlayers.length}
									total={allFinanceRows.length}
									tone="neutral"
								/>
							</div>
						</div>

						<div className="rounded-2xl border border-slate-200 bg-white p-4">
							<h3 className="font-semibold text-slate-900">
								Top outstanding
							</h3>
							{topOutstandingRows.length === 0 ? (
								<p className="mt-3 text-sm text-slate-500">
									No outstanding balances for the current filter.
								</p>
							) : (
								<div className="mt-4 space-y-3">
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
						</div>
					</div>
				</div>
			</PanelCard>

			<PanelCard
				title="Player balances"
				action={
					<div className="flex flex-wrap items-center gap-2">
							<FilterButton
								label="Owed"
								value="owed"
								activeValue={financeFilter}
								onChange={(value) => setFinanceFilter(value as FinanceFilter)}
								count={financeSummary.playersOwingMoney.length}
							/>
							<FilterButton
								label="All"
								value="all"
								activeValue={financeFilter}
								onChange={(value) => setFinanceFilter(value as FinanceFilter)}
								count={allFinanceRows.length}
							/>
							<FilterButton
								label="Paid"
								value="paid"
								activeValue={financeFilter}
								onChange={(value) => setFinanceFilter(value as FinanceFilter)}
								count={financeSummary.paidPlayers.length}
							/>
							<FilterButton
								label="Part paid"
								value="part-paid"
								activeValue={financeFilter}
								onChange={(value) => setFinanceFilter(value as FinanceFilter)}
								count={financeSummary.partPaidPlayers.length}
							/>
							<FilterButton
								label="Unpaid"
								value="unpaid"
								activeValue={financeFilter}
								onChange={(value) => setFinanceFilter(value as FinanceFilter)}
								count={financeSummary.unpaidPlayers.length}
							/>
						</div>
				}
			>
				<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<label className="flex items-center gap-2 text-sm text-slate-600">
						<input
							type="checkbox"
							checked={includeInactive}
							onChange={(event) => setIncludeInactive(event.target.checked)}
						/>
						Include inactive players
					</label>
					<div className="flex items-center gap-2">
						{copyStatus && (
							<span className="text-xs font-semibold text-slate-500">
								{copyStatus}
							</span>
						)}
						<button
							type="button"
							onClick={handleCopyTable}
							className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
						>
							Copy table
						</button>
						<button
							type="button"
							onClick={handleExportCsv}
							className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
						>
							Export CSV
						</button>
					</div>
				</div>

				<FinanceTable
					rows={financeRows}
					activeSeasonId={activeSeasonId}
					onSetOwed={(player) => openAmountModal("owed", player)}
					onAddPayment={(player) => openAmountModal("payment", player)}
					onAddAdjustment={(player) => openAmountModal("adjustment", player)}
					onRemovePayment={removePlayerPayment}
				/>
			</PanelCard>

			<Modal
				isOpen={Boolean(amountModal)}
				title={modalTitle}
				onClose={closeAmountModal}
				onConfirm={handleConfirmAmountModal}
				confirmText={isSavingFinance ? "Saving..." : modalConfirmText}
			>
				<div className="space-y-4">
					{formError && (
						<p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
							{formError}
						</p>
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
							placeholder={amountModal?.mode === "adjustment" ? "e.g. -5.00" : "0.00"}
						/>
					</label>
					{amountModal?.mode !== "owed" && (
						<label className="block text-sm font-semibold text-slate-700">
							Note
							<input
								value={paymentNote}
								onChange={(event) => setPaymentNote(event.target.value)}
								className="mt-1 w-full rounded-lg border px-3 py-2"
								placeholder={
									amountModal?.mode === "adjustment"
										? "e.g. discount, correction"
										: "e.g. subs, fines, kit money"
								}
							/>
						</label>
					)}
					{amountModal?.mode === "adjustment" && (
						<p className="text-sm text-slate-500">
							Use a negative amount for a discount or credit. Use a positive
							amount for a correction that increases the balance.
						</p>
					)}
				</div>
			</Modal>

			<Modal
				isOpen={isBulkModalOpen}
				title="Bulk Set Owed"
				onClose={closeBulkModal}
				onConfirm={handleConfirmBulkAmount}
				confirmText={isSavingFinance ? "Saving..." : "Apply Amount"}
			>
				<div className="space-y-4">
					{bulkFormError && (
						<p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
							{bulkFormError}
						</p>
					)}
					<p className="text-sm text-slate-500">
						This updates the amount owed for the selected group in{" "}
						{activeSeason?.name ?? "the active season"}. It does not remove
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
						This will update{" "}
						<strong>{bulkTargetRows.length}</strong>{" "}
						{bulkTargetRows.length === 1 ? "player" : "players"}.
					</p>
				</div>
			</Modal>
		</div>
	);
}

function StatusBar({
	label,
	value,
	total,
}: {
	label: string;
	value: number;
	total: number;
	tone: "success" | "warning" | "danger" | "neutral";
}) {
	const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

	return (
		<div className="rounded-xl bg-slate-50 p-3">
			<div className="flex items-center justify-between text-sm">
				<span className="font-semibold text-slate-700">{label}</span>
				<span className="text-slate-500">
					{value} · {percentage}%
				</span>
			</div>
			<div className="mt-2">
				<ProgressBar value={percentage} />
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
			<div className="mb-1 flex items-center justify-between text-sm">
				<span className="font-semibold text-slate-700">{name}</span>
				<span className="text-slate-500">{formatCurrency(value)}</span>
			</div>
			<ProgressBar value={percentage} />
		</div>
	);
}
