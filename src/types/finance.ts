export type FinancePayment = {
	id: string;
	amount: number;
	note?: string;
	paidAt: string;
};

export type PlayerFinanceRecord = {
	playerId: string;
	seasonId?: string;
	amountOwed: number;
	payments: FinancePayment[];
};

export type NewFinancePaymentInput = {
	amount: number;
	note?: string;
};