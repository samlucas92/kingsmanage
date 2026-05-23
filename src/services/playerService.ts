import type { Player } from "../stores/players";

export function addPlayerRecord(players: Player[], player: Player) {
	return [...players, player];
}

export function updatePlayerRecord(
	players: Player[],
	playerId: string,
	updatedPlayer: Omit<Player, "id">
) {
	return players.map((player) =>
		player.id === playerId
			? {
					...player,
					...updatedPlayer,
				}
			: player
	);
}

export function removePlayerRecord(players: Player[], playerId: string) {
	return players.filter((player) => player.id !== playerId);
}

export function togglePlayerActiveRecord(players: Player[], playerId: string) {
	return players.map((player) =>
		player.id === playerId
			? {
					...player,
					isActive: !player.isActive,
				}
			: player
	);
}