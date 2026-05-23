import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
	addPlayerPaymentRecord,
	removePlayerPaymentRecord,
	setPlayerAmountOwedRecord,
} from "../services/financeService";

export type FinancePayment = {
	id: string;
	amount: number;
	note?: string;
	paidAt: string;
};

export type PlayerFinanceRecord = {
	playerId: string;
	amountOwed: number;
	payments: FinancePayment[];
};

type FinanceStore = {
	playerFinanceRecords: PlayerFinanceRecord[];

	setPlayerAmountOwed: (playerId: string, amountOwed: number) => void;

	addPlayerPayment: (
		playerId: string,
		payment: {
			amount: number;
			note?: string;
		}
	) => void;

	removePlayerPayment: (playerId: string, paymentId: string) => void;
};

export const useFinanceStore = create<FinanceStore>()(
	persist(
		(set) => ({
			playerFinanceRecords: [],

			setPlayerAmountOwed: (playerId, amountOwed) =>
				set((state) => ({
					playerFinanceRecords: setPlayerAmountOwedRecord(
						state.playerFinanceRecords,
						playerId,
						amountOwed
					),
				})),

			addPlayerPayment: (playerId, payment) =>
				set((state) => ({
					playerFinanceRecords: addPlayerPaymentRecord(
						state.playerFinanceRecords,
						playerId,
						payment
					),
				})),

			removePlayerPayment: (playerId, paymentId) =>
				set((state) => ({
					playerFinanceRecords: removePlayerPaymentRecord(
						state.playerFinanceRecords,
						playerId,
						paymentId
					),
				})),
		}),
		{
			name: "kingsbridge-colts-finance-store",
			storage: createJSONStorage(() => localStorage),
		}
	)
);