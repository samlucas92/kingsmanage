import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { seedPlayers } from "../data/seedPlayers";

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
					players: [...state.players, player],
				})),

			updatePlayer: (id, updatedPlayer) =>
				set((state) => ({
					players: state.players.map((player) =>
						player.id === id
							? {
									...player,
									...updatedPlayer,
								}
							: player
					),
				})),

			removePlayer: (id) =>
				set((state) => ({
					players: state.players.filter((player) => player.id !== id),
				})),

			togglePlayerActive: (id) =>
				set((state) => ({
					players: state.players.map((player) =>
						player.id === id
							? {
									...player,
									isActive: !player.isActive,
								}
							: player
					),
				})),
		}),
		{
			name: "kingsbridge-colts-player-store",
			storage: createJSONStorage(() => localStorage),
		}
	)
);