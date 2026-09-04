import type { Player } from "../../stores/players";

export type PlayerStatusFilter = "active" | "inactive" | "all";
export type PlayersViewMode = "cards" | "list";

export function getPlayersSummary(players: Player[]) {
	return {
		total: players.length,
		active: players.filter((player) => player.isActive).length,
		inactive: players.filter((player) => !player.isActive).length,
		goalkeepers: players.filter(
			(player) => player.isActive && player.positions.includes("GK")
		).length,
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

export function getPlayerInitials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");
}

export function getPlayerAvatarTone(name: string) {
	const tones = [
		"bg-blue-100 text-blue-800",
		"bg-violet-100 text-violet-800",
		"bg-amber-100 text-amber-800",
		"bg-emerald-100 text-emerald-800",
	];
	const index = [...name].reduce(
		(total, character) => total + character.charCodeAt(0),
		0
	) % tones.length;
	return tones[index];
}
