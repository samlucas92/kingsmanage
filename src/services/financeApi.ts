import { apiClient } from "./apiClient";
import type {
	FinanceTransaction,
	FinanceTransactionType,
	PlayerFinanceRecord,
	PlayerFinanceSummary,
} from "../types/finance";

export type GoogleSheetsFinanceSyncResult = {
	direction: "import" | "export";
	playerId: string;
	playerName: string;
	sheetName: string;
	rowNumber: number;
	cellsChanged: number;
	amountChanged: number;
	message: string;
};

export type GoogleSheetsFinanceImportItem = {
	id: string;
	playerId: string;
	playerName: string;
	playerNumber: number;
	label: string;
	sheetAmount: number;
	recordedAmount: number;
	amountToAdd: number;
	alreadyRecorded: boolean;
};

export type GoogleSheetsFinanceImportPreview = {
	sheetName: string;
	items: GoogleSheetsFinanceImportItem[];
	unmatchedPlayers: string[];
};

export type GoogleSheetsFinanceImportResult = {
	sheetName: string;
	transactionsCreated: number;
	playersUpdated: number;
	amountCreated: number;
	message: string;
};

export type GoogleSheetsFinanceResetResult = {
	deletedPayments: number;
	message: string;
};

export const financeApi = {
	getSeasonFinance: async (seasonId?: string) => {
		const path = seasonId
			? `/finance?seasonId=${encodeURIComponent(seasonId)}`
			: "/finance";
		const summaries = await apiClient.get<PlayerFinanceSummary[]>(path);
		return summaries.map(toPlayerFinanceRecord);
	},

	getMyFinance: (seasonId?: string) => {
		const query = seasonId ? `?seasonId=${encodeURIComponent(seasonId)}` : "";
		return apiClient.get<PlayerFinanceSummary>(`/finance/mine${query}`);
	},

	setPlayerAmountOwed: async ({
		playerId,
		seasonId,
		amount,
	}: {
		playerId: string;
		seasonId?: string;
		amount: number;
	}) => {
		const query = seasonId ? `?seasonId=${encodeURIComponent(seasonId)}` : "";
		return apiClient.put<FinanceTransaction>(
			`/finance/players/${encodeURIComponent(playerId)}/amount-owed${query}`,
			{ amount }
		);
	},

	addTransaction: async ({
		playerId,
		seasonId,
		type,
		amount,
		note,
	}: {
		playerId: string;
		seasonId?: string;
		type: FinanceTransactionType;
		amount: number;
		note?: string;
	}) => {
		return apiClient.post<FinanceTransaction>("/finance/transactions", {
			playerId,
			seasonId,
			type,
			amount,
			note,
		});
	},

	deleteTransaction: async (transactionId: string) => {
		await apiClient.delete(`/finance/transactions/${encodeURIComponent(transactionId)}`);
	},

	previewPlayerGoogleSheetsImport: (playerId: string, seasonId: string) =>
		apiClient.post<GoogleSheetsFinanceImportPreview>(
			`/finance/google-sheets/players/${encodeURIComponent(playerId)}/import-preview`,
			{ seasonId }
		),

	previewSeasonGoogleSheetsImport: (seasonId: string) =>
		apiClient.post<GoogleSheetsFinanceImportPreview>(
			"/finance/google-sheets/import-preview",
			{ seasonId }
		),

	importSelectedGoogleSheetsPayments: (seasonId: string, transactionIds: string[]) =>
		apiClient.post<GoogleSheetsFinanceImportResult>(
			"/finance/google-sheets/import",
			{ seasonId, transactionIds }
		),

	resetSeasonPayments: (seasonId: string) =>
		apiClient.delete<GoogleSheetsFinanceResetResult>(
			`/finance/google-sheets/payments?seasonId=${encodeURIComponent(seasonId)}`
		),

	exportPlayerToGoogleSheets: (playerId: string, seasonId: string) =>
		apiClient.post<GoogleSheetsFinanceSyncResult>(
			`/finance/google-sheets/players/${encodeURIComponent(playerId)}/export`,
			{ seasonId }
		),
};

function toPlayerFinanceRecord(summary: PlayerFinanceSummary): PlayerFinanceRecord {
	const payments = summary.transactions
		.filter((transaction) => transaction.type === "Payment")
		.map((transaction) => ({
			id: transaction.id,
			amount: transaction.amount,
			note: transaction.note,
			paidAt: transaction.transactionDate,
		}));

	return {
		playerId: summary.playerId,
		seasonId: summary.seasonId,
		amountOwed: summary.amountOwed,
		payments,
		transactions: summary.transactions,
		totalCharged: summary.totalCharged,
		totalAdjustments: summary.totalAdjustments,
		totalPaid: summary.totalPaid,
		balance: summary.balance,
	};
}
