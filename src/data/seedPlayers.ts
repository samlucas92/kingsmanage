import type { Player } from "../stores/players";

export const seedPlayers: Player[] = [
	{
		id: "1",
		name: "Alex Wilson",
		positions: ["CB", "CM"],
		appearances: 100,
		isActive: true,
		number: 2,
	},
	{
		id: "2",
		name: "Chris Morgan",
		positions: ["ST"],
		appearances: 500,
		isActive: true,
		number: 10,
	},
	{
		id: "3",
		name: "Dai Rowe",
		positions: ["GK", "ST"],
		appearances: 200,
		isActive: true,
		number: 54,
	},
];