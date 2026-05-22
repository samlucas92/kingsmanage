export const PLAYER_POSITIONS = [
	"GK",
	"LB",
	"CB",
	"RB",
	"LWB",
	"RWB",
	"CDM",
	"CM",
	"CAM",
	"LM",
	"RM",
	"LW",
	"RW",
	"ST",
	"CF",
] as const;

export type PlayerPosition = (typeof PLAYER_POSITIONS)[number];

const positionGroups: Record<string, string[]> = {
	GK: ["GK"],

	CB: ["CB", "LB", "RB", "LWB", "RWB", "DEF"],
	LB: ["LB", "LWB", "CB", "DEF"],
	RB: ["RB", "RWB", "CB", "DEF"],
	LWB: ["LWB", "LB", "LM", "DEF"],
	RWB: ["RWB", "RB", "RM", "DEF"],

	CM: ["CM", "CDM", "CAM", "MID"],
	CDM: ["CDM", "CM", "MID"],
	CAM: ["CAM", "CM", "MID"],
	LM: ["LM", "LW", "LWB", "MID"],
	RM: ["RM", "RW", "RWB", "MID"],
	LAM: ["CAM", "LAM", "LW", "LM", "MID"],
	RAM: ["CAM", "RAM", "RW", "RM", "MID"],

	LW: ["LW", "LM", "LAM", "ST", "ATT"],
	RW: ["RW", "RM", "RAM", "ST", "ATT"],
	ST: ["ST", "LW", "RW", "CF", "ATT"],
	CF: ["CF", "ST", "CAM", "ATT"],
};

export function normalisePosition(position: string) {
	return position.trim().toUpperCase();
}

export function isPositionCompatible(
	playerPositions: string[],
	formationPosition: string
) {
	const normalisedFormationPosition = normalisePosition(formationPosition);

	const compatiblePositions =
		positionGroups[normalisedFormationPosition] ?? [
			normalisedFormationPosition,
		];

	return playerPositions.some((playerPosition) =>
		compatiblePositions.includes(normalisePosition(playerPosition))
	);
}

export function getPositionFitLabel(
	playerPositions: string[],
	formationPosition: string
) {
	const normalisedFormationPosition = normalisePosition(formationPosition);

	const isExactMatch = playerPositions.some(
		(playerPosition) =>
			normalisePosition(playerPosition) === normalisedFormationPosition
	);

	if (isExactMatch) {
		return "Natural";
	}

	if (isPositionCompatible(playerPositions, formationPosition)) {
		return "Good fit";
	}

	return "Out of position";
}