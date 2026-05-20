import { create } from "zustand";

export type Player = {
  id: string;
  name: string;
  positions: string[];
  appearances: number;
  number: number;
  isActive: boolean;
};

type PlayerState = {
  players: Player[];
  addPlayer: (player: Player) => void;
  removePlayer: (id: string) => void;
  togglePlayerActive: (id: string) => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
    players: [
        { id: "1", name: "Alex Wilson", positions: ["CB", "CM"], appearances: 100, isActive: true, number: 2 },
        { id: "2", name: "Chris Morgan", positions: ["ST"], appearances:500, isActive: true, number: 10 },
        { id: "3", name: "Dai Rowe", positions: ["GK", "ST"], appearances: 200, isActive:true, number: 54  },
    ],

  getPlayers() {
    return this.players;
  },

  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players, player],
    })),

  removePlayer: (id) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== id),
    })),
  togglePlayerActive: (id) =>
    set((state) => ({
      players: state.players.map((player) =>
        player.id === id
          ? { ...player, isActive: !player.isActive }
          : player
      ),
    })),
}));