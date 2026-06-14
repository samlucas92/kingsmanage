import { create } from "zustand";

import { financeApi } from "../services/financeApi";
import type {
	NewFinanceAdjustmentInput,
	NewFinancePaymentInput,
	PlayerFinanceRecord,
} from "../types/finance";

export type {
	FinancePayment,
	NewFinanceAdjustmentInput,
	NewFinancePaymentInput,
	PlayerFinanceRecord,
} from "../types/finance";

type FinanceStore = {
	playerFinanceRecords: PlayerFinanceRecord[];
	isLoadingFinance: boolean;
	hasLoadedFinance: boolean;
	loadedFinanceSeasonId: string;
	financeLoadError: string;
	loadFinance: (seasonId?: string, force?: boolean) => Promise<void>;
	setPlayerAmountOwed: (
		playerId: string,
		amountOwed: number,
		seasonId?: string
	) => Promise<void>;
	addPlayerPayment: (
		playerId: string,
		payment: NewFinancePaymentInput,
		seasonId?: string
	) => Promise<void>;
	addPlayerAdjustment: (
		playerId: string,
		adjustment: NewFinanceAdjustmentInput,
		seasonId?: string
	) => Promise<void>;
	removePlayerPayment: (
		playerId: string,
		paymentId: string,
		seasonId?: string
	) => Promise<void>;
};

function normaliseSeasonId(seasonId?: string) {
	return seasonId ?? "";
}

export const useFinanceStore = create<FinanceStore>()((set, get) => ({
	playerFinanceRecords: [],
	isLoadingFinance: false,
	hasLoadedFinance: false,
	loadedFinanceSeasonId: "",
	financeLoadError: "",

	loadFinance: async (seasonId, force = false) => {
		const targetSeasonId = normaliseSeasonId(seasonId);
		const state = get();

		if (state.isLoadingFinance) {
			return;
		}

		if (
			state.hasLoadedFinance &&
			state.loadedFinanceSeasonId === targetSeasonId &&
			!force
		) {
			return;
		}

		set({
			isLoadingFinance: true,
			financeLoadError: "",
		});

		try {
			const records = await financeApi.getSeasonFinance(seasonId);

			set({
				playerFinanceRecords: records,
				isLoadingFinance: false,
				hasLoadedFinance: true,
				loadedFinanceSeasonId: targetSeasonId,
			});
		} catch (error) {
			set({
				isLoadingFinance: false,
				financeLoadError:
					error instanceof Error
						? error.message
						: "Failed to load finance records.",
			});
		}
	},

	setPlayerAmountOwed: async (playerId, amountOwed, seasonId) => {
		await financeApi.setPlayerAmountOwed({
			playerId,
			seasonId,
			amount: amountOwed,
		});

		await get().loadFinance(seasonId, true);
	},

	addPlayerPayment: async (playerId, payment, seasonId) => {
		await financeApi.addTransaction({
			playerId,
			seasonId,
			type: "Payment",
			amount: payment.amount,
			note: payment.note,
		});

		await get().loadFinance(seasonId, true);
	},

	addPlayerAdjustment: async (playerId, adjustment, seasonId) => {
		await financeApi.addTransaction({
			playerId,
			seasonId,
			type: "Adjustment",
			amount: adjustment.amount,
			note: adjustment.note,
		});

		await get().loadFinance(seasonId, true);
	},

	removePlayerPayment: async (_playerId, paymentId, seasonId) => {
		await financeApi.deleteTransaction(paymentId);
		await get().loadFinance(seasonId, true);
	},
}));
