import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
	addPlayerPaymentRecord,
	normaliseFinanceRecords,
	removePlayerPaymentRecord,
	setPlayerAmountOwedRecord,
} from "../services/financeService";
import type {
	NewFinancePaymentInput,
	PlayerFinanceRecord,
} from "../types/finance";

export type {
	FinancePayment,
	NewFinancePaymentInput,
	PlayerFinanceRecord,
} from "../types/finance";

type FinanceStore = {
	playerFinanceRecords: PlayerFinanceRecord[];

	setPlayerAmountOwed: (
		playerId: string,
		amountOwed: number,
		seasonId?: string
	) => void;

	addPlayerPayment: (
		playerId: string,
		payment: NewFinancePaymentInput,
		seasonId?: string
	) => void;

	removePlayerPayment: (
		playerId: string,
		paymentId: string,
		seasonId?: string
	) => void;
};

export const useFinanceStore = create<FinanceStore>()(
	persist(
		(set) => ({
			playerFinanceRecords: [],

			setPlayerAmountOwed: (playerId, amountOwed, seasonId) =>
				set((state) => ({
					playerFinanceRecords: setPlayerAmountOwedRecord({
						records: state.playerFinanceRecords,
						playerId,
						amountOwed,
						seasonId,
					}),
				})),

			addPlayerPayment: (playerId, payment, seasonId) =>
				set((state) => ({
					playerFinanceRecords: addPlayerPaymentRecord({
						records: state.playerFinanceRecords,
						playerId,
						payment,
						seasonId,
					}),
				})),

			removePlayerPayment: (playerId, paymentId, seasonId) =>
				set((state) => ({
					playerFinanceRecords: removePlayerPaymentRecord({
						records: state.playerFinanceRecords,
						playerId,
						paymentId,
						seasonId,
					}),
				})),
		}),
		{
			name: "kingsbridge-colts-finance-store",
			storage: createJSONStorage(() => localStorage),
			version: 2,
			migrate: (persistedState) => {
				const state = persistedState as Partial<FinanceStore>;

				return {
					...state,
					playerFinanceRecords: normaliseFinanceRecords(
						state.playerFinanceRecords ?? []
					),
				};
			},
		}
	)
);