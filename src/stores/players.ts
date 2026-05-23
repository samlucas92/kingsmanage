import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { seedPlayers } from "../data/seedPlayers";
import {
	addPlayerRecord,
	removePlayerRecord,
	togglePlayerActiveRecord,
	updatePlayerRecord,
} from "../services/playerService";

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
	updatePlayer: (id: string, player: Omit<Player, "id">) => void;
	removePlayer: (id: string) => void;
	togglePlayerActive: (id: string) => void;
};

export const usePlayerStore = create<PlayerState>()(
	persist(
		(set) => ({
			players: seedPlayers,

			addPlayer: (player) =>
				set((state) => ({
					players: addPlayerRecord(state.players, player),
				})),

			updatePlayer: (id, updatedPlayer) =>
				set((state) => ({
					players: updatePlayerRecord(state.players, id, updatedPlayer),
				})),

			removePlayer: (id) =>
				set((state) => ({
					players: removePlayerRecord(state.players, id),
				})),

			togglePlayerActive: (id) =>
				set((state) => ({
					players: togglePlayerActiveRecord(state.players, id),
				})),
		}),
		{
			name: "kingsbridge-colts-player-store",
			storage: createJSONStorage(() => localStorage),
		}
	)
);