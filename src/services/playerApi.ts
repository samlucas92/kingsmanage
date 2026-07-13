import type { Player, PlayerInput } from "../stores/players";
import { apiClient } from "./apiClient";

export const playerApi = {
	getPlayers: () => apiClient.get<Player[]>("/players"),

	getPlayer: (id: string) => apiClient.get<Player>(`/players/${id}`),

	createPlayer: (player: PlayerInput) => apiClient.post<Player>("/players", player),

	updatePlayer: (id: string, player: Player) =>
		apiClient.put<Player>(`/players/${id}`, player),

	setPlayerActive: (id: string, isActive: boolean) =>
		apiClient.patch<Player>(`/players/${id}/active`, isActive),
};
