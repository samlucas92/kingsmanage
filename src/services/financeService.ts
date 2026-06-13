import type { Player } from "../stores/players";
import { DEFAULT_SEASON_ID } from "../data/seedSeasons";
import type { ExportColumn } from "./exportService";
import type {
	FinancePayment,
	NewFinancePaymentInput,
	PlayerFinanceRecord,
} from "../types/finance";
import { formatDate } from "../utils/format";

export type FinanceFilter =
	| "owed"
	| "all"
	| "paid"
	| "part-paid"
	| "unpaid"
	| "nothing-owed";

export type BulkTarget = "active" | "visible" | "filtered";

export type FinanceRowData = {
	player: Player;
	record?: PlayerFinanceRecord;
	amountOwed: number;
	totalPaid: number;
	balance: number;
	status: string;
};

export type FinanceSummary = {
	totalExpected: number;
	totalPaid: number;
	totalOutstanding: number;
	paidPercentage: number;
	outstandingPercentage: number;
	averageOwed: number;
	averagePaid: number;
	playersOwingMoney: FinanceRowData[];
	paidPlayers: FinanceRowData[];
	partPaidPlayers: FinanceRowData[];
	unpaidPlayers: FinanceRowData[];
	nothingOwedPlayers: FinanceRowData[];
};

export function getFinanceRecordSeasonId(seasonId?: string) {
	return seasonId ?? DEFAULT_SEASON_ID;
}

export function normaliseFinanceRecords(records: PlayerFinanceRecord[]) {
	return records.map((record) => ({
		...record,
		seasonId: getFinanceRecordSeasonId(record.seasonId),
		payments: record.payments ?? [],
	}));
}

export function getPlayerTotalPaid(record?: PlayerFinanceRecord) {
	if (!record) {
		return 0;
	}

	return record.totalPaid ?? record.payments.reduce(
		(total, payment) => total + payment.amount,
		0
	);
}

export function getPlayerBalance(record?: PlayerFinanceRecord) {
	if (!record) {
		return 0;
	}

	return record.balance ?? Math.max(0, record.amountOwed - getPlayerTotalPaid(record));
}

export function getPlayerPaymentStatus(record?: PlayerFinanceRecord) {
	if (!record || record.amountOwed <= 0) {
		return "nothing-owed";
	}

	const totalPaid = getPlayerTotalPaid(record);

	if (totalPaid >= record.amountOwed) {
		return "paid";
	}

	if (totalPaid > 0) {
		return "part-paid";
	}

	return "unpaid";
}

export function getFinanceRecord({
	records,
	playerId,
	seasonId,
}: {
	records: PlayerFinanceRecord[];
	playerId: string;
	seasonId?: string;
}) {
	const targetSeasonId = getFinanceRecordSeasonId(seasonId);

	return records.find(
		(record) =>
			record.playerId === playerId &&
			getFinanceRecordSeasonId(record.seasonId) === targetSeasonId
	);
}

export function setPlayerAmountOwedRecord({
	records,
	playerId,
	amountOwed,
	seasonId,
}: {
	records: PlayerFinanceRecord[];
	playerId: string;
	amountOwed: number;
	seasonId?: string;
}) {
	const targetSeasonId = getFinanceRecordSeasonId(seasonId);
	const safeAmountOwed = normaliseMoneyAmount(amountOwed);
	const existingRecord = getFinanceRecord({
		records,
		playerId,
		seasonId: targetSeasonId,
	});

	if (!existingRecord) {
		return [
			...records,
			{
				playerId,
				seasonId: targetSeasonId,
				amountOwed: safeAmountOwed,
				payments: [],
			},
		];
	}

	return records.map((record) => {
		const isTargetRecord =
			record.playerId === playerId &&
			getFinanceRecordSeasonId(record.seasonId) === targetSeasonId;

		if (!isTargetRecord) {
			return record;
		}

		return {
			...record,
			seasonId: targetSeasonId,
			amountOwed: safeAmountOwed,
			payments: record.payments ?? [],
		};
	});
}

export function addPlayerPaymentRecord({
	records,
	playerId,
	payment,
	seasonId,
}: {
	records: PlayerFinanceRecord[];
	playerId: string;
	payment: NewFinancePaymentInput;
	seasonId?: string;
}) {
	const targetSeasonId = getFinanceRecordSeasonId(seasonId);
	const newPayment: FinancePayment = {
		id: crypto.randomUUID(),
		amount: normaliseMoneyAmount(payment.amount),
		note: payment.note,
		paidAt: new Date().toISOString(),
	};
	const existingRecord = getFinanceRecord({
		records,
		playerId,
		seasonId: targetSeasonId,
	});

	if (!existingRecord) {
		return [
			...records,
			{
				playerId,
				seasonId: targetSeasonId,
				amountOwed: 0,
				payments: [newPayment],
			},
		];
	}

	return records.map((record) => {
		const isTargetRecord =
			record.playerId === playerId &&
			getFinanceRecordSeasonId(record.seasonId) === targetSeasonId;

		if (!isTargetRecord) {
			return record;
		}

		return {
			...record,
			seasonId: targetSeasonId,
			payments: [...(record.payments ?? []), newPayment],
		};
	});
}

export function removePlayerPaymentRecord({
	records,
	playerId,
	paymentId,
	seasonId,
}: {
	records: PlayerFinanceRecord[];
	playerId: string;
	paymentId: string;
	seasonId?: string;
}) {
	const targetSeasonId = getFinanceRecordSeasonId(seasonId);

	return records.map((record) => {
		const isTargetRecord =
			record.playerId === playerId &&
			getFinanceRecordSeasonId(record.seasonId) === targetSeasonId;

		if (!isTargetRecord) {
			return record;
		}

		return {
			...record,
			seasonId: targetSeasonId,
			payments: (record.payments ?? []).filter(
				(payment) => payment.id !== paymentId
			),
		};
	});
}

export function buildFinanceRows({
	players,
	playerFinanceRecords,
	seasonId,
	includeInactive,
}: {
	players: Player[];
	playerFinanceRecords: PlayerFinanceRecord[];
	seasonId: string;
	includeInactive: boolean;
}): FinanceRowData[] {
	return players
		.filter((player) => includeInactive || player.isActive)
		.map((player) => {
			const record = getFinanceRecord({
				records: playerFinanceRecords,
				playerId: player.id,
				seasonId,
			});
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
		.sort((firstRow, secondRow) => {
			if (secondRow.balance !== firstRow.balance) {
				return secondRow.balance - firstRow.balance;
			}

			if (secondRow.amountOwed !== firstRow.amountOwed) {
				return secondRow.amountOwed - firstRow.amountOwed;
			}

			return firstRow.player.name.localeCompare(secondRow.player.name);
		});
}

export function filterFinanceRows({
	rows,
	filter,
}: {
	rows: FinanceRowData[];
	filter: FinanceFilter;
}) {
	return rows.filter((row) => {
		if (filter === "all") {
			return true;
		}

		if (filter === "owed") {
			return row.balance > 0;
		}

		return row.status === filter;
	});
}

export function getFinanceSummary(rows: FinanceRowData[]): FinanceSummary {
	const totalExpected = rows.reduce(
		(total, row) => total + row.amountOwed,
		0
	);
	const totalPaid = rows.reduce((total, row) => total + row.totalPaid, 0);
	const totalOutstanding = rows.reduce(
		(total, row) => total + row.balance,
		0
	);
	const playersOwingMoney = rows.filter((row) => row.balance > 0);
	const paidPlayers = rows.filter((row) => row.status === "paid");
	const partPaidPlayers = rows.filter((row) => row.status === "part-paid");
	const unpaidPlayers = rows.filter((row) => row.status === "unpaid");
	const nothingOwedPlayers = rows.filter(
		(row) => row.status === "nothing-owed"
	);
	const paidPercentage =
		totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;
	const outstandingPercentage =
		totalExpected > 0
			? Math.round((totalOutstanding / totalExpected) * 100)
			: 0;
	const averageOwed = rows.length > 0 ? totalExpected / rows.length : 0;
	const averagePaid = rows.length > 0 ? totalPaid / rows.length : 0;

	return {
		totalExpected,
		totalPaid,
		totalOutstanding,
		paidPercentage,
		outstandingPercentage,
		averageOwed,
		averagePaid,
		playersOwingMoney,
		paidPlayers,
		partPaidPlayers,
		unpaidPlayers,
		nothingOwedPlayers,
	};
}

export function getTopOutstandingRows(rows: FinanceRowData[], limit = 8) {
	return rows.filter((row) => row.balance > 0).slice(0, limit);
}

export function getHighestOutstandingBalance(rows: FinanceRowData[]) {
	return rows.reduce((highest, row) => Math.max(highest, row.balance), 0);
}

export function getBulkTargetRows({
	bulkTarget,
	allRows,
	filteredRows,
}: {
	bulkTarget: BulkTarget;
	allRows: FinanceRowData[];
	filteredRows: FinanceRowData[];
}) {
	if (bulkTarget === "filtered") {
		return filteredRows;
	}

	if (bulkTarget === "visible") {
		return allRows;
	}

	return allRows.filter((row) => row.player.isActive);
}

export function getFinanceExportColumns(): ExportColumn<FinanceRowData>[] {
	return [
		{
			label: "Player",
			getValue: (row) => row.player.name,
		},
		{
			label: "Number",
			getValue: (row) => row.player.number,
		},
		{
			label: "Active",
			getValue: (row) => (row.player.isActive ? "Yes" : "No"),
		},
		{
			label: "Amount Owed",
			getValue: (row) => row.amountOwed,
		},
		{
			label: "Paid",
			getValue: (row) => row.totalPaid,
		},
		{
			label: "Outstanding",
			getValue: (row) => row.balance,
		},
		{
			label: "Status",
			getValue: (row) => getReadableFinanceStatus(row.status),
		},
		{
			label: "Payments Recorded",
			getValue: (row) => row.record?.payments.length ?? 0,
		},
		{
			label: "Last Payment",
			getValue: (row) => {
				const latestPayment = [...(row.record?.payments ?? [])].sort(
					(firstPayment, secondPayment) =>
						new Date(secondPayment.paidAt).getTime() -
						new Date(firstPayment.paidAt).getTime()
				)[0];

				return latestPayment ? formatDate(latestPayment.paidAt) : "";
			},
		},
	];
}

export function getReadableFinanceStatus(status: string) {
	if (status === "part-paid") {
		return "Part paid";
	}

	if (status === "nothing-owed") {
		return "Nothing owed";
	}

	return status.charAt(0).toUpperCase() + status.slice(1);
}

function normaliseMoneyAmount(value: number) {
	if (!Number.isFinite(value) || value < 0) {
		return 0;
	}

	return Math.round(value * 100) / 100;
}
