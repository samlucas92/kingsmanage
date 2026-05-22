import type { Match } from "../stores/match";

const emptyMatchNotes = {
	availability: "",
	tactical: "",
	injuries: "",
	general: "",
};

export const seedMatches: Match[] = [
	{
		id: "1",
		opponent: "St Thomas Stars",
		date: "2026-08-15T14:00:00",
		venue: "home",
		state: "upcoming",
		isCompleted: false,
		isLineupLocked: false,
		selectedFormation: "4-4-2",
		notes: emptyMatchNotes,
		postponements: [],
		selectedPlayers: [],
	},
	{
		id: "2",
		opponent: "Murton",
		date: "2026-08-08T14:00:00",
		venue: "away",
		state: "won",
		result: {
			homeGoals: 1,
			awayGoals: 3,
		},
		isCompleted: true,
		isLineupLocked: false,
		selectedFormation: "4-4-2",
		notes: emptyMatchNotes,
		postponements: [],
		selectedPlayers: [],
	},
];