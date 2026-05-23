import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_SEASON_ID } from "../data/seedSeasons";
import {
	addPlayerPaymentRecord,
	getFinanceRecordSeasonId,
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
	seasonId?: string;
	amountOwed: number;
	payments: FinancePayment[];
};

type FinanceStore = {
	playerFinanceRecords: PlayerFinanceRecord[];

	setPlayerAmountOwed: (
		playerId: string,
		amountOwed: number,
		seasonId?: string
	) => void;

	addPlayerPayment: (
		playerId: string,
		payment: {
			amount: number;
			note?: string;
		},
		seasonId?: string
	) => void;

	removePlayerPayment: (
		playerId: string,
		paymentId: string,
		seasonId?: string
	) => void;
};

function normaliseFinanceRecords(records: PlayerFinanceRecord[]) {
	return records.map((record) => ({
		...record,
		seasonId: getFinanceRecordSeasonId(record),
	}));
}

export const useFinanceStore = create<FinanceStore>()(
	persist(
		(set) => ({
			playerFinanceRecords: [],

			setPlayerAmountOwed: (
				playerId,
				amountOwed,
				seasonId = DEFAULT_SEASON_ID
			) =>
				set((state) => ({
					playerFinanceRecords: setPlayerAmountOwedRecord(
						state.playerFinanceRecords,
						playerId,
						amountOwed,
						seasonId
					),
				})),

			addPlayerPayment: (
				playerId,
				payment,
				seasonId = DEFAULT_SEASON_ID
			) =>
				set((state) => ({
					playerFinanceRecords: addPlayerPaymentRecord(
						state.playerFinanceRecords,
						playerId,
						payment,
						seasonId
					),
				})),

			removePlayerPayment: (
				playerId,
				paymentId,
				seasonId = DEFAULT_SEASON_ID
			) =>
				set((state) => ({
					playerFinanceRecords: removePlayerPaymentRecord(
						state.playerFinanceRecords,
						playerId,
						paymentId,
						seasonId
					),
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