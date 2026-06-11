import { create } from "zustand";
import {
	addPlayerRecord,
	removePlayerRecord,
	updatePlayerRecord,
} from "../services/playerService";
import { playerApi } from "../services/playerApi";

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
	isLoadingPlayers: boolean;
	playerLoadError: string;
	loadPlayers: () => Promise<void>;
	addPlayer: (player: Player) => Promise<void>;
	updatePlayer: (id: string, player: Omit<Player, "id">) => Promise<void>;
	removePlayer: (id: string) => void;
	togglePlayerActive: (id: string) => Promise<void>;
};

export const usePlayerStore = create<PlayerState>()((set, get) => ({
	players: [],
	isLoadingPlayers: false,
	playerLoadError: "",

	loadPlayers: async () => {
		set({
			isLoadingPlayers: true,
			playerLoadError: "",
		});

		try {
			const players = await playerApi.getPlayers();

			set({
				players,
				isLoadingPlayers: false,
			});
		} catch (error) {
			set({
				isLoadingPlayers: false,
				playerLoadError:
					error instanceof Error
						? error.message
						: "Failed to load players.",
			});
		}
	},

	addPlayer: async (player) => {
		const createdPlayer = await playerApi.createPlayer(player);

		set((state) => ({
			players: addPlayerRecord(state.players, createdPlayer),
		}));
	},

	updatePlayer: async (id, updatedPlayer) => {
		const player = get().players.find((currentPlayer) => currentPlayer.id === id);

		if (!player) {
			return;
		}

		const savedPlayer = await playerApi.updatePlayer(id, {
			id,
			...updatedPlayer,
		});

		set((state) => ({
			players: updatePlayerRecord(state.players, id, savedPlayer),
		}));
	},

	removePlayer: (id) =>
		set((state) => ({
			players: removePlayerRecord(state.players, id),
		})),

	togglePlayerActive: async (id) => {
		const player = get().players.find((currentPlayer) => currentPlayer.id === id);

		if (!player) {
			return;
		}

		const updatedPlayer = await playerApi.setPlayerActive(id, !player.isActive);

		set((state) => ({
			players: updatePlayerRecord(state.players, id, updatedPlayer),
		}));
	},
}));