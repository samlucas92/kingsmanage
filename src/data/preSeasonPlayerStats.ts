type PreSeasonPlayerStat = {
	name: string;
	appearances: number;
	goals: number;
};

export const preSeasonPlayerStats: PreSeasonPlayerStat[] = [
	{ name: "Adam Tucker", appearances: 205, goals: 10 },
	{ name: "Alberto Garcia", appearances: 27, goals: 1 },
	{ name: "Alex Wilson", appearances: 237, goals: 53 },
	{ name: "Alhadi Yagob", appearances: 14, goals: 4 },
	{ name: "Arwel Davies", appearances: 159, goals: 81 },
	{ name: "Bamidele Abraham", appearances: 12, goals: 0 },
	{ name: "Chris Davison", appearances: 13, goals: 0 },
	{ name: "Chris Evans", appearances: 0, goals: 0 },
	{ name: "Chris Morgan", appearances: 287, goals: 220 },
	{ name: "Chris Ramsell", appearances: 305, goals: 39 },
	{ name: "Corum Davies", appearances: 157, goals: 30 },
	{ name: "Dai Rowe", appearances: 311, goals: 50 },
	{ name: "Daniel Carney", appearances: 8, goals: 0 },
	{ name: "Daniel Martlew", appearances: 35, goals: 0 },
	{ name: "David Budde", appearances: 0, goals: 0 },
	{ name: "Devon Hough", appearances: 7, goals: 0 },
	{ name: "Franck Wenko", appearances: 0, goals: 0 },
	{ name: "Jack Davies", appearances: 129, goals: 106 },
	{ name: "Jean-Paul Haba", appearances: 10, goals: 6 },
	{ name: "John Hough", appearances: 34, goals: 0 },
	{ name: "Jordan Stephen", appearances: 48, goals: 0 },
	{ name: "Josh Perkins", appearances: 4, goals: 0 },
	{ name: "Lee Hartnoll", appearances: 103, goals: 0 },
	{ name: "Lee Seager", appearances: 228, goals: 40 },
	{ name: "Leighton Donnelly", appearances: 0, goals: 0 },
	{ name: "Liam Mapstone", appearances: 215, goals: 34 },
	{ name: "Luke Barroccu", appearances: 19, goals: 3 },
	{ name: "Mark Corcoran", appearances: 242, goals: 85 },
	{ name: "Mark Newey", appearances: 33, goals: 0 },
	{ name: "Martin Gregory", appearances: 209, goals: 0 },
	{ name: "Mohammed Alkhammasi", appearances: 15, goals: 0 },
	{ name: "Muhammed Saleh", appearances: 28, goals: 8 },
	{ name: "Mohammed Ali", appearances: 87, goals: 40 },
	{ name: "Mohamed Osman", appearances: 0, goals: 9 },
	{ name: "Mohsin Mohammed", appearances: 44, goals: 13 },
	{ name: "Muhitr Rahman", appearances: 77, goals: 7 },
	{ name: "Nadir Taha", appearances: 32, goals: 2 },
	{ name: "Nathan Hopkins", appearances: 38, goals: 23 },
	{ name: "Nick Hopkins", appearances: 291, goals: 144 },
	{ name: "Oliver Maleci", appearances: 0, goals: 0 },
	{ name: "Omer Talal Mubarak", appearances: 52, goals: 13 },
	{ name: "Rabi Hadari", appearances: 53, goals: 30 },
	{ name: "Rhys Andrew", appearances: 4, goals: 0 },
	{ name: "Rhys Richardson", appearances: 117, goals: 63 },
	{ name: "Richard Moore", appearances: 171, goals: 25 },
	{ name: "Riyadh Zman", appearances: 0, goals: 0 },
	{ name: "Ryan Thomas", appearances: 37, goals: 3 },
	{ name: "Sam Lucas", appearances: 276, goals: 55 },
	{ name: "Thom Norton", appearances: 190, goals: 88 },
	{ name: "Tom Haynes", appearances: 75, goals: 25 },
	{ name: "Tom Sinnott", appearances: 20, goals: 0 },
	{ name: "Yousif Adulazeez", appearances: 15, goals: 2 },
	{ name: "Zak Bird", appearances: 0, goals: 0 },
];

function normaliseName(name: string) {
	return name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ");
}

export function getPreSeasonPlayerStats(playerName: string) {
	const normalisedPlayerName = normaliseName(playerName);

	return (
		preSeasonPlayerStats.find(
			(playerStat) => normaliseName(playerStat.name) === normalisedPlayerName
		) ?? {
			name: playerName,
			appearances: 0,
			goals: 0,
		}
	);
}
