export type SportSurface = "football-pitch" | "rugby-pitch" | "cricket-field" | "hockey-pitch" | "netball-court";

export type SportPosition = { key: string; label: string; group: string };
export type FormationSlot = { key: string; label: string; x: number; y: number };
export type SportFormation = { key: string; name: string; slots: FormationSlot[] };
export type SportDefinition = {
	key: string;
	name: string;
	surface: SportSurface;
	playersPerSide: number;
	positions: SportPosition[];
	formations: SportFormation[];
};

const positions = (values: string[]): SportPosition[] => values.map((value) => {
	const [key, label, group] = value.split("|");
	return { key, label, group };
});
const slots = (values: [string, string, number, number][]): FormationSlot[] =>
	values.map(([key, label, x, y]) => ({ key, label, x, y }));

const footballPositions = positions([
	"GK|Goalkeeper|Goalkeeper", "LB|Left Back|Defence", "CB|Centre Back|Defence", "RB|Right Back|Defence", "LWB|Left Wing Back|Defence", "RWB|Right Wing Back|Defence", "CDM|Defensive Midfielder|Midfield", "CM|Central Midfielder|Midfield", "CAM|Attacking Midfielder|Midfield", "LM|Left Midfielder|Midfield", "RM|Right Midfielder|Midfield", "LW|Left Wing|Attack", "RW|Right Wing|Attack", "ST|Striker|Attack", "CF|Centre Forward|Attack",
]);

export const sportDefinitions: Record<string, SportDefinition> = {
	football: {
		key: "football", name: "Football", surface: "football-pitch", playersPerSide: 11, positions: footballPositions,
		formations: [
			{ key: "4-4-2", name: "4-4-2", slots: slots([["gk", "GK", 50, 88], ["lb", "LB", 20, 68], ["lcb", "CB", 40, 70], ["rcb", "CB", 60, 70], ["rb", "RB", 80, 68], ["lm", "LM", 20, 46], ["lcm", "CM", 40, 50], ["rcm", "CM", 60, 50], ["rm", "RM", 80, 46], ["lst", "ST", 40, 24], ["rst", "ST", 60, 24]]) },
			{ key: "4-3-3", name: "4-3-3", slots: slots([["gk", "GK", 50, 88], ["lb", "LB", 20, 68], ["lcb", "CB", 40, 70], ["rcb", "CB", 60, 70], ["rb", "RB", 80, 68], ["lcm", "CM", 30, 48], ["cm", "CM", 50, 52], ["rcm", "CM", 70, 48], ["lw", "LW", 25, 24], ["st", "ST", 50, 20], ["rw", "RW", 75, 24]]) },
			{ key: "3-5-2", name: "3-5-2", slots: slots([["gk", "GK", 50, 88], ["lcb", "CB", 30, 70], ["cb", "CB", 50, 72], ["rcb", "CB", 70, 70], ["lwb", "LWB", 15, 48], ["lcm", "CM", 35, 52], ["cm", "CM", 50, 54], ["rcm", "CM", 65, 52], ["rwb", "RWB", 85, 48], ["lst", "ST", 40, 24], ["rst", "ST", 60, 24]]) },
			{ key: "4-2-3-1", name: "4-2-3-1", slots: slots([["gk", "GK", 50, 88], ["lb", "LB", 20, 68], ["lcb", "CB", 40, 70], ["rcb", "CB", 60, 70], ["rb", "RB", 80, 68], ["lcdm", "CDM", 40, 53], ["rcdm", "CDM", 60, 53], ["lam", "LAM", 25, 35], ["cam", "CAM", 50, 32], ["ram", "RAM", 75, 35], ["st", "ST", 50, 18]]) },
		],
	},
	"rugby-union": {
		key: "rugby-union", name: "Rugby Union", surface: "rugby-pitch", playersPerSide: 15,
		positions: positions(["PR|Prop|Forwards", "HK|Hooker|Forwards", "LK|Lock|Forwards", "FL|Flanker|Forwards", "N8|Number Eight|Forwards", "SH|Scrum Half|Backs", "FH|Fly Half|Backs", "CE|Centre|Backs", "WG|Wing|Backs", "FB|Full Back|Backs"]),
		formations: [{ key: "standard-xv", name: "Standard XV", slots: slots([["loosehead", "PR", 35, 75], ["hooker", "HK", 50, 77], ["tighthead", "PR", 65, 75], ["lock-left", "LK", 42, 66], ["lock-right", "LK", 58, 66], ["flanker-left", "FL", 34, 56], ["number-eight", "N8", 50, 53], ["flanker-right", "FL", 66, 56], ["scrum-half", "SH", 42, 44], ["fly-half", "FH", 56, 39], ["left-wing", "WG", 16, 27], ["inside-centre", "CE", 45, 29], ["outside-centre", "CE", 62, 25], ["right-wing", "WG", 84, 20], ["full-back", "FB", 50, 12]]) }],
	},
	"rugby-league": {
		key: "rugby-league", name: "Rugby League", surface: "rugby-pitch", playersPerSide: 13,
		positions: positions(["FB|Fullback|Backs", "WG|Winger|Backs", "CE|Centre|Backs", "FE|Five-Eighth|Halves", "HB|Halfback|Halves", "PR|Prop|Forwards", "HK|Hooker|Forwards", "SR|Second Row|Forwards", "LK|Lock|Forwards"]),
		formations: [{ key: "standard-xiii", name: "Standard XIII", slots: slots([["fullback", "FB", 50, 12], ["left-wing", "WG", 12, 26], ["left-centre", "CE", 32, 30], ["right-centre", "CE", 68, 30], ["right-wing", "WG", 88, 26], ["five-eighth", "FE", 43, 43], ["halfback", "HB", 57, 47], ["left-prop", "PR", 40, 63], ["hooker", "HK", 50, 68], ["right-prop", "PR", 60, 63], ["left-second-row", "SR", 35, 77], ["right-second-row", "SR", 65, 77], ["lock", "LK", 50, 84]]) }],
	},
	cricket: {
		key: "cricket", name: "Cricket", surface: "cricket-field", playersPerSide: 11,
		positions: positions(["WK|Wicket Keeper|Field", "SL|Slip|Field", "PT|Point|Field", "CV|Cover|Field", "MO|Mid Off|Field", "MN|Mid On|Field", "FL|Fine Leg|Field", "DEEP|Deep Fielder|Field", "BAT|Batter|Batting", "AR|All-rounder|All-rounder", "BOWL|Bowler|Bowling"]),
		formations: [{ key: "fielding-standard", name: "Standard Field", slots: slots([["wk", "WK", 50, 62], ["slip-1", "SL", 39, 58], ["slip-2", "SL", 30, 53], ["point", "PT", 22, 40], ["cover", "CV", 30, 25], ["mid-off", "MO", 43, 31], ["bowler", "BOWL", 50, 20], ["mid-on", "MN", 59, 31], ["square-leg", "SL", 75, 43], ["fine-leg", "FL", 68, 72], ["deep", "DEEP", 50, 8]]) }],
	},
	hockey: {
		key: "hockey", name: "Hockey", surface: "hockey-pitch", playersPerSide: 11,
		positions: positions(["GK|Goalkeeper|Goalkeeper", "DF|Defender|Defence", "MF|Midfielder|Midfield", "FW|Forward|Attack"]),
		formations: [{ key: "3-4-3", name: "3-4-3", slots: slots([["gk", "GK", 50, 88], ["ld", "DF", 28, 68], ["cd", "DF", 50, 72], ["rd", "DF", 72, 68], ["lm", "MF", 18, 48], ["lcm", "MF", 40, 52], ["rcm", "MF", 60, 52], ["rm", "MF", 82, 48], ["lw", "FW", 25, 24], ["cf", "FW", 50, 20], ["rw", "FW", 75, 24]]) }],
	},
	netball: {
		key: "netball", name: "Netball", surface: "netball-court", playersPerSide: 7,
		positions: positions(["GS|Goal Shooter|Attack", "GA|Goal Attack|Attack", "WA|Wing Attack|Midcourt", "C|Centre|Midcourt", "WD|Wing Defence|Midcourt", "GD|Goal Defence|Defence", "GK|Goal Keeper|Defence"]),
		formations: [{ key: "standard-seven", name: "Standard Seven", slots: slots([["gk", "GK", 50, 88], ["gd", "GD", 35, 74], ["wd", "WD", 65, 62], ["c", "C", 50, 50], ["wa", "WA", 35, 38], ["ga", "GA", 65, 26], ["gs", "GS", 50, 12]]) }],
	},
};

export function getSportDefinition(key?: string | null) {
	return sportDefinitions[key ?? "football"] ?? sportDefinitions.football;
}

export function getClubSportDefinition(
	key?: string | null,
	customFormations: SportFormation[] = []
) {
	const sport = getSportDefinition(key);
	const formations = [...sport.formations, ...customFormations].filter(
		(formation, index, all) =>
			all.findIndex((candidate) => candidate.key === formation.key) === index
	);

	return {
		...sport,
		formations,
	};
}
