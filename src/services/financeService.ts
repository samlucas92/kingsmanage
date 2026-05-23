import { DEFAULT_SEASON_ID } from "../data/seedSeasons";
import type {
	FinancePayment,
	PlayerFinanceRecord,
} from "../stores/finance";

export function getFinanceRecordSeasonId(
	record: Pick<PlayerFinanceRecord, "seasonId">
) {
	return record.seasonId ?? DEFAULT_SEASON_ID;
}

export function createPlayerFinanceRecord(
	playerId: string,
	amountOwed: number,
	seasonId = DEFAULT_SEASON_ID
): PlayerFinanceRecord {
	return {
		playerId,
		seasonId,
		amountOwed,
		payments: [],
	};
}

function recordMatchesPlayerAndSeason(
	record: PlayerFinanceRecord,
	playerId: string,
	seasonId: string
) {
	return (
		record.playerId === playerId &&
		getFinanceRecordSeasonId(record) === seasonId
	);
}

export function setPlayerAmountOwedRecord(
	records: PlayerFinanceRecord[],
	playerId: string,
	amountOwed: number,
	seasonId = DEFAULT_SEASON_ID
) {
	const existingRecord = records.find((record) =>
		recordMatchesPlayerAndSeason(record, playerId, seasonId)
	);

	if (!existingRecord) {
		return [
			...records,
			createPlayerFinanceRecord(playerId, amountOwed, seasonId),
		];
	}

	return records.map((record) =>
		recordMatchesPlayerAndSeason(record, playerId, seasonId)
			? {
					...record,
					seasonId,
					amountOwed,
				}
			: record
	);
}

export function addPlayerPaymentRecord(
	records: PlayerFinanceRecord[],
	playerId: string,
	payment: Omit<FinancePayment, "id" | "paidAt">,
	seasonId = DEFAULT_SEASON_ID
) {
	const nextPayment: FinancePayment = {
		id: crypto.randomUUID(),
		amount: payment.amount,
		note: payment.note,
		paidAt: new Date().toISOString(),
	};

	const existingRecord = records.find((record) =>
		recordMatchesPlayerAndSeason(record, playerId, seasonId)
	);

	if (!existingRecord) {
		return [
			...records,
			{
				playerId,
				seasonId,
				amountOwed: 0,
				payments: [nextPayment],
			},
		];
	}

	return records.map((record) =>
		recordMatchesPlayerAndSeason(record, playerId, seasonId)
			? {
					...record,
					seasonId,
					payments: [...record.payments, nextPayment],
				}
			: record
	);
}

export function removePlayerPaymentRecord(
	records: PlayerFinanceRecord[],
	playerId: string,
	paymentId: string,
	seasonId = DEFAULT_SEASON_ID
) {
	return records.map((record) =>
		recordMatchesPlayerAndSeason(record, playerId, seasonId)
			? {
					...record,
					seasonId,
					payments: record.payments.filter(
						(payment) => payment.id !== paymentId
					),
				}
			: record
	);
}

export function getPlayerTotalPaid(record?: PlayerFinanceRecord) {
	if (!record) {
		return 0;
	}

	return record.payments.reduce((total, payment) => total + payment.amount, 0);
}

export function getPlayerBalance(record?: PlayerFinanceRecord) {
	if (!record) {
		return 0;
	}

	return Math.max(0, record.amountOwed - getPlayerTotalPaid(record));
}

export function getPlayerPaymentStatus(record?: PlayerFinanceRecord) {
	if (!record || record.amountOwed <= 0) {
		return "nothing-owed";
	}

	const totalPaid = getPlayerTotalPaid(record);

	if (totalPaid <= 0) {
		return "unpaid";
	}

	if (totalPaid >= record.amountOwed) {
		return "paid";
	}

	return "part-paid";
}