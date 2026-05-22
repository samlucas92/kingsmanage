import { create } from "zustand";

type Charge = {
  playerId: string;
  amount: number;
  reason: string; // e.g. "Match Fee vs Swansea FC"
};

type Payment = {
  playerId: string;
  amount: number;
};

type FinanceState = {
  charges: Charge[];
  payments: Payment[];

  addCharge: (charge: Charge) => void;
  addPayment: (payment: Payment) => void;

  getPlayerBalance: (playerId: string) => number;
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  charges: [
    {
        playerId: "1",
        amount: 5,
        reason: ""
    },
    {
        playerId: "1",
        amount: 5,
        reason: ""
    },
    {
        playerId: "1",
        amount: 5,
        reason: ""
    },
    {
        playerId: "2",
        amount: 5,
        reason: ""
    }
  ],
  payments: [
    {
        playerId: "1",
        amount:5
    }
  ],

  addCharge: (charge) =>
    set((state) => ({
      charges: [...state.charges, charge],
    })),

  addPayment: (payment) =>
    set((state) => ({
      payments: [...state.payments, payment],
    })),

  getPlayerBalance: (playerId) => {
    const { charges, payments } = get();

    const totalCharges = charges
      .filter((c) => c.playerId === playerId)
      .reduce((sum, c) => sum + c.amount, 0);

    const totalPayments = payments
      .filter((p) => p.playerId === playerId)
      .reduce((sum, p) => sum + p.amount, 0);
    return totalCharges - totalPayments;
  },
}));