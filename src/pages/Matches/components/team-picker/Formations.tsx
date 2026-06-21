import { sportDefinitions } from "../../../../constants/sports";

export const formations = Object.fromEntries(
	sportDefinitions.football.formations.map((formation) => [formation.key, formation.slots])
);
