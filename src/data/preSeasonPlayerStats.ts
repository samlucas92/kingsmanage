type PreSeasonPlayerStat = {
	name: string;
	appearances: number;
	goals: number;
};

export const preSeasonPlayerStats: PreSeasonPlayerStat[] = [
	{ name: "Adam Tucker", appearances: 192, goals: 7 },
	{ name: "Alberto Garcia", appearances: 27, goals: 1 },
	{ name: "Alex Wilson", appearances: 216, goals: 49 },
	{ name: "Alhadi Yagob", appearances: 4, goals: 2 },
	{ name: "Arwel Davies", appearances: 137, goals: 75 },
	{ name: "Bamidele Abraham", appearances: 0, goals: 0 },
	{ name: "Chris Davison", appearances: 0, goals: 0 },
	{ name: "Chris Evans", appearances: 0, goals: 0 },
	{ name: "Chris Morgan", appearances: 277, goals: 218 },
	{ name: "Chris Ramsell", appearances: 281, goals: 38 },
	{ name: "Corum Davies", appearances: 151, goals: 29 },
	{ name: "Dai Rowe", appearances: 292, goals: 46 },
	{ name: "Daniel Carney", appearances: 8, goals: 0 },
	{ name: "Daniel Martlew", appearances: 18, goals: 0 },
	{ name: "David Budde", appearances: 0, goals: 0 },
	{ name: "Devon Hough", appearances: 0, goals: 0 },
	{ name: "Franck Wenko", appearances: 0, goals: 0 },
	{ name: "Jack Davies", appearances: 120, goals: 97 },
	{ name: "Jean-Paul Haba", appearances: 6, goals: 4 },
	{ name: "John Hough", appearances: 18, goals: 0 },
	{ name: "Jordan Stephen", appearances: 46, goals: 0 },
	{ name: "Josh Perkins", appearances: 0, goals: 0 },
	{ name: "Lee Hartnoll", appearances: 93, goals: 0 },
	{ name: "Lee Seager", appearances: 228, goals: 40 },
	{ name: "Leighton Donnelly", appearances: 0, goals: 0 },
	{ name: "Liam Mapstone", appearances: 215, goals: 34 },
	{ name: "Luke Barroccu", appearances: 18, goals: 3 },
	{ name: "Mark Corcoran", appearances: 237, goals: 85 },
	{ name: "Mark Newey", appearances: 17, goals: 0 },
	{ name: "Martin Gregory", appearances: 209, goals: 0 },
	{ name: "Mohammed Alkhammasi", appearances: 0, goals: 0 },
	{ name: "Muhammed Saleh", appearances: 19, goals: 7 },
	{ name: "Mohammed Ali", appearances: 68, goals: 34 },
	{ name: "Mohamed Osman", appearances: 0, goals: 9 },
	{ name: "Mohsin Mohammed", appearances: 32, goals: 9 },
	{ name: "Muhitr Rahman", appearances: 59, goals: 6 },
	{ name: "Nadir Taha", appearances: 32, goals: 2 },
	{ name: "Nathan Hopkins", appearances: 38, goals: 23 },
	{ name: "Nick Hopkins", appearances: 271, goals: 137 },
	{ name: "Oliver Maleci", appearances: 0, goals: 0 },
	{ name: "Omer Talal Mubarak", appearances: 37, goals: 11 },
	{ name: "Rabi Hadari", appearances: 47, goals: 26 },
	{ name: "Rhys Andrew", appearances: 0, goals: 0 },
	{ name: "Rhys Richardson", appearances: 91, goals: 49 },
	{ name: "Richard Moore", appearances: 171, goals: 25 },
	{ name: "Riyadh Zman", appearances: 0, goals: 0 },
	{ name: "Ryan Thomas", appearances: 22, goals: 2 },
	{ name: "Sam Lucas", appearances: 250, goals: 53 },
	{ name: "Thom Norton", appearances: 173, goals: 85 },
	{ name: "Tom Haynes", appearances: 68, goals: 24 },
	{ name: "Tom Sinnott", appearances: 0, goals: 0 },
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