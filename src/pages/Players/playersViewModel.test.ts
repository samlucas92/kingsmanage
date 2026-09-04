import { describe, expect, it } from "vitest";

import type { Player } from "../../stores/players";
import {
	filterPlayers,
	getPlayerAvatarTone,
	getPlayerInitials,
	getPlayersSummary,
} from "./playersViewModel";

const players: Player[] = [
	{ id: "1", name: "Alex Wilson", number: 12, positions: ["CB", "RB"], appearances: 20, isActive: true },
	{ id: "2", name: "Ben Harris", number: 1, positions: ["GK"], appearances: 8, isActive: true },
	{ id: "3", name: "Chris Jones", number: 9, positions: ["ST"], appearances: 14, isActive: false },
];

describe("players view model", () => {
	it("builds useful squad summary counts", () => {
		expect(getPlayersSummary(players)).toEqual({
			total: 3,
			active: 2,
			inactive: 1,
			goalkeepers: 1,
		});
	});

	it("searches names, numbers and positions and applies status filters", () => {
		expect(filterPlayers({ players, searchTerm: "12", position: "all", status: "active" }).map((player) => player.id)).toEqual(["1"]);
		expect(filterPlayers({ players, searchTerm: "GK", position: "all", status: "active" }).map((player) => player.id)).toEqual(["2"]);
		expect(filterPlayers({ players, searchTerm: "", position: "ST", status: "inactive" }).map((player) => player.id)).toEqual(["3"]);
	});

	it("builds stable player avatar details", () => {
		expect(getPlayerInitials("  Alex Wilson ")).toBe("AW");
		expect(getPlayerAvatarTone("Alex Wilson")).toBe(getPlayerAvatarTone("Alex Wilson"));
	});
});
