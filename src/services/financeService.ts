import type {
	FinancePayment,
	PlayerFinanceRecord,
} from "../stores/finance";

export function createPlayerFinanceRecord(
	playerId: string,
	amountOwed: number
): PlayerFinanceRecord {
	return {
		playerId,
		amountOwed,
		payments: [],
	};
}

export function setPlayerAmountOwedRecord(
	records: PlayerFinanceRecord[],
	playerId: string,
	amountOwed: number
) {
	const existingRecord = records.find((record) => record.playerId === playerId);

	if (!existingRecord) {
		return [...records, createPlayerFinanceRecord(playerId, amountOwed)];
	}

	return records.map((record) =>
		record.playerId === playerId
			? {
					...record,
					amountOwed,
				}
			: record
	);
}

export function addPlayerPaymentRecord(
	records: PlayerFinanceRecord[],
	playerId: string,
	payment: Omit<FinancePayment, "id" | "paidAt">
) {
	const nextPayment: FinancePayment = {
		id: crypto.randomUUID(),
		amount: payment.amount,
		note: payment.note,
		paidAt: new Date().toISOString(),
	};

	const existingRecord = records.find((record) => record.playerId === playerId);

	if (!existingRecord) {
		return [
			...records,
			{
				playerId,
				amountOwed: 0,
				payments: [nextPayment],
			},
		];
	}

	return records.map((record) =>
		record.playerId === playerId
			? {
					...record,
					payments: [...record.payments, nextPayment],
				}
			: record
	);
}

export function removePlayerPaymentRecord(
	records: PlayerFinanceRecord[],
	playerId: string,
	paymentId: string
) {
	return records.map((record) =>
		record.playerId === playerId
			? {
					...record,
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