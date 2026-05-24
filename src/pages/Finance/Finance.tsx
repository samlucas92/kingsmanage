import { useMemo, useState } from "react";
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
			`Set amount owed to ${formatCurrency(amount)} for ${
				bulkTargetRows.length
			} ${bulkTargetRows.length === 1 ? "player" : "players"} in ${
				activeSeason?.name ?? "the active season"
			}?`
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

			<PanelCard>
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
						<span>Paid {formatCurrency(financeSummary.totalPaid)}</span>
						<span>
							Outstanding {formatCurrency(financeSummary.totalOutstanding)}
						</span>
					</div>

					<ProgressBar
						value={financeSummary.paidPercentage}
						heightClassName="h-4"
					/>
				</div>
			</PanelCard>

			<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
				<MetricCard
					label="Expected"
					value={formatCurrency(financeSummary.totalExpected)}
					helper={`${allFinanceRows.length} visible players`}
				/>

				<MetricCard
					label="Paid"
					value={formatCurrency(financeSummary.totalPaid)}
					helper={`${financeSummary.paidPercentage}% collected`}
					tone="success"
				/>

				<MetricCard
					label="Outstanding"
					value={formatCurrency(financeSummary.totalOutstanding)}
					helper={`${financeSummary.outstandingPercentage}% still owed`}
					tone={financeSummary.totalOutstanding > 0 ? "danger" : "success"}
				/>

				<MetricCard
					label="Players Owing"
					value={financeSummary.playersOwingMoney.length}
					helper={`${financeSummary.paidPlayers.length} fully paid`}
					tone={
						financeSummary.playersOwingMoney.length > 0 ? "danger" : "success"
					}
				/>
			</div>

			<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
				<MetricCard
					label="Average Owed"
					value={formatCurrency(financeSummary.averageOwed)}
					helper="Per visible player"
				/>

				<MetricCard
					label="Average Paid"
					value={formatCurrency(financeSummary.averagePaid)}
					helper="Per visible player"
				/>

				<MetricCard
					label="Part Paid"
					value={financeSummary.partPaidPlayers.length}
					tone={financeSummary.partPaidPlayers.length > 0 ? "warning" : "default"}
				/>

				<MetricCard
					label="Unpaid"
					value={financeSummary.unpaidPlayers.length}
					tone={financeSummary.unpaidPlayers.length > 0 ? "danger" : "default"}
				/>
			</div>

			<div className="grid min-w-0 gap-6 xl:grid-cols-2">
				<PanelCard
					title="Payment Status"
					description="Breakdown of players by payment state."
				>
					<div className="space-y-4">
						<StatusBar
							label="Paid"
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
				</PanelCard>

				<PanelCard
					title="Top Outstanding"
					description="Players with the highest active-season balance."
				>
					{topOutstandingRows.length === 0 ? (
						<div className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-800">
							No outstanding balances for the current filter.
						</div>
					) : (
						<div className="space-y-4">
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
			</div>

			<PanelCard
				title="Bulk finance tools"
				description="Set the same amount owed for a group of players in the active season."
				tone="info"
				action={
					<button
						type="button"
						onClick={openBulkModal}
						className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
					>
						Bulk Set Owed
					</button>
				}
			>
				<p className="text-sm text-blue-800">
					Use this when subs, fines or starting balances need applying to
					multiple players at once.
				</p>
			</PanelCard>

			<PanelCard contentClassName="flex min-w-0 flex-wrap items-center gap-3">
				<FilterButton
					label="Owes Money"
					value="owed"
					count={financeSummary.playersOwingMoney.length}
					activeValue={financeFilter}
					onChange={setFinanceFilter}
				/>

				<FilterButton
					label="Unpaid"
					value="unpaid"
					count={financeSummary.unpaidPlayers.length}
					activeValue={financeFilter}
					onChange={setFinanceFilter}
				/>

				<FilterButton
					label="Part Paid"
					value="part-paid"
					count={financeSummary.partPaidPlayers.length}
					activeValue={financeFilter}
					onChange={setFinanceFilter}
				/>

				<FilterButton
					label="Paid"
					value="paid"
					count={financeSummary.paidPlayers.length}
					activeValue={financeFilter}
					onChange={setFinanceFilter}
				/>

				<FilterButton
					label="Nothing Owed"
					value="nothing-owed"
					count={financeSummary.nothingOwedPlayers.length}
					activeValue={financeFilter}
					onChange={setFinanceFilter}
				/>

				<FilterButton
					label="All"
					value="all"
					count={allFinanceRows.length}
					activeValue={financeFilter}
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
			</PanelCard>

			<div className="min-w-0 overflow-hidden rounded-xl bg-white shadow">
				<FinanceTable
					rows={financeRows}
					activeSeasonId={activeSeasonId}
					onSetOwed={(player) => openAmountModal("owed", player)}
					onAddPayment={(player) => openAmountModal("payment", player)}
					onRemovePayment={removePlayerPayment}
				/>
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

function StatusBar({
	label,
	value,
	total,
	tone,
}: {
	label: string;
	value: number;
	total: number;
	tone: "success" | "warning" | "danger" | "neutral";
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

			<ProgressBar value={value} max={total} tone={tone} />
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
	return (
		<div>
			<div className="mb-1 flex items-center justify-between gap-3 text-sm">
				<span className="min-w-0 truncate font-semibold text-slate-700">
					{name}
				</span>
				<span className="shrink-0 text-slate-500">
					{formatCurrency(value)}
				</span>
			</div>

			<ProgressBar value={value} max={maxValue} tone="danger" />
		</div>
	);
}