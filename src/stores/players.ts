import { create } from "zustand";
import {
	addPlayerRecord,
	removePlayerRecord,
	updatePlayerRecord,
} from "../services/playerService";
import { playerApi } from "../services/playerApi";
import { getAsyncErrorMessage } from "./asyncStore";

export type Player = {
	id: string;
	name: string;
	positions: string[];
	appearances: number;
	number: number;
	isActive: boolean;
};

export type PlayerInput = Omit<Player, "id">;

type PlayerState = {
	players: Player[];
	isLoadingPlayers: boolean;
	hasLoadedPlayers: boolean;
	playerLoadError: string;
	loadPlayers: (force?: boolean) => Promise<void>;
	loadPlayer: (id: string, force?: boolean) => Promise<void>;
	addPlayer: (player: PlayerInput) => Promise<void>;
	updatePlayer: (id: string, player: PlayerInput) => Promise<void>;
	removePlayer: (id: string) => void;
	togglePlayerActive: (id: string) => Promise<void>;
};

function replacePlayer(players: Player[], updatedPlayer: Player) {
	const exists = players.some((player) => player.id === updatedPlayer.id);

	if (!exists) {
		return addPlayerRecord(players, updatedPlayer);
	}

	return updatePlayerRecord(players, updatedPlayer.id, updatedPlayer);
}

export const usePlayerStore = create<PlayerState>()((set, get) => ({
	players: [],
	isLoadingPlayers: false,
	hasLoadedPlayers: false,
	playerLoadError: "",

	loadPlayers: async (force = false) => {
		if (get().isLoadingPlayers) {
			return;
		}

		if (get().hasLoadedPlayers && !force) {
			return;
		}

		set({
			isLoadingPlayers: true,
			playerLoadError: "",
		});

		try {
			const players = await playerApi.getPlayers();

			set({
				players,
				isLoadingPlayers: false,
				hasLoadedPlayers: true,
			});
		} catch (error) {
			set({
				isLoadingPlayers: false,
				playerLoadError: getAsyncErrorMessage(error, "Failed to load players."),
			});
		}
	},

	loadPlayer: async (id, force = false) => {
		if (!id) {
			return;
		}

		if (!force && get().players.some((player) => player.id === id)) {
			return;
		}

		set({
			isLoadingPlayers: true,
			playerLoadError: "",
		});

		try {
			const player = await playerApi.getPlayer(id);

			set((state) => ({
				players: replacePlayer(state.players, player),
				isLoadingPlayers: false,
			}));
		} catch (error) {
			set({
				isLoadingPlayers: false,
				playerLoadError: getAsyncErrorMessage(error, "Failed to load player."),
			});
		}
	},

	addPlayer: async (player) => {
		const createdPlayer = await playerApi.createPlayer(player);

		set((state) => ({
			players: addPlayerRecord(state.players, createdPlayer),
			hasLoadedPlayers: true,
		}));
	},

	updatePlayer: async (id, updatedPlayer) => {
		const savedPlayer = await playerApi.updatePlayer(id, {
			id,
			...updatedPlayer,
		});

		set((state) => ({
			players: replacePlayer(state.players, savedPlayer),
		}));
	},

	removePlayer: (id) =>
		set((state) => ({
			players: removePlayerRecord(state.players, id),
		})),

	togglePlayerActive: async (id) => {
		const player = get().players.find(
			(currentPlayer) => currentPlayer.id === id
		);

		if (!player) {
			return;
		}

		const updatedPlayer = await playerApi.setPlayerActive(
			id,
			!player.isActive
		);

		set((state) => ({
			players: replacePlayer(state.players, updatedPlayer),
		}));
	},
}));
