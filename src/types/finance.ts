export type FinanceTransactionType = "Charge" | "Payment" | "Adjustment";

export type FinancePayment = {
	id: string;
	amount: number;
	note?: string;
	paidAt: string;
};

export type FinanceTransaction = {
	id: string;
	playerId: string;
	seasonId?: string;
	type: FinanceTransactionType;
	amount: number;
	note?: string;
	transactionDate: string;
};

export type PlayerFinanceRecord = {
	playerId: string;
	seasonId?: string;
	amountOwed: number;
	payments: FinancePayment[];
	transactions?: FinanceTransaction[];
	totalCharged?: number;
	totalAdjustments?: number;
	totalPaid?: number;
	balance?: number;
};

export type PlayerFinanceSummary = {
	playerId: string;
	playerName: string;
	playerNumber: number;
	isActive: boolean;
	seasonId?: string;
	totalCharged: number;
	totalAdjustments: number;
	amountOwed: number;
	totalPaid: number;
	balance: number;
	transactions: FinanceTransaction[];
};

export type NewFinancePaymentInput = {
	amount: number;
	note?: string;
};

export type NewFinanceAdjustmentInput = {
	amount: number;
	note?: string;
};
