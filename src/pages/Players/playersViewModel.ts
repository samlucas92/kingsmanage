import type { Player } from "../../stores/players";

export type PlayerStatusFilter = "active" | "inactive" | "all";
export type PlayersViewMode = "cards" | "list";

export function getPlayersSummary(players: Player[]) {
	return {
		total: players.length,
		active: players.filter((player) => player.isActive).length,
		inactive: players.filter((player) => !player.isActive).length,
		goalkeepers: players.filter((player) => player.positions.includes("GK")).length,
	};
}

export function filterPlayers({
	players,
	position,
	searchTerm,
	status,
}: {
	players: Player[];
	position: string;
	searchTerm: string;
	status: PlayerStatusFilter;
}) {
	const search = searchTerm.trim().toLocaleLowerCase();

	return players.filter((player) => {
		const matchesSearch = !search || [
			player.name,
			String(player.number),
			...player.positions,
		].some((value) => value.toLocaleLowerCase().includes(search));
		const matchesPosition = position === "all" || player.positions.includes(position);
		const matchesStatus = status === "all" || (status === "active" ? player.isActive : !player.isActive);

		return matchesSearch && matchesPosition && matchesStatus;
	});
}
