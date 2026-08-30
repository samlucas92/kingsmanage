import type { Match } from "../../stores/match";
import {
	FIRST_TEAM_ID,
	SECOND_TEAM_ID,
	normaliseLegacyTeamId,
	type ClubTeamProfile,
} from "../../stores/clubTeams";

export const matchImportTemplate = [
	"date,time,team,opponent,venue,location,competition",
	'2026-09-05,15:00,First Team,Example United,Home,"The Recreation Ground, Main Road",League',
].join("\n");

export type ParsedMatchImportRow = {
	rowNumber: number;
	date: string;
	time: string;
	teamId: string;
	teamName: string;
	opponent: string;
	venue: "home" | "away";
	location: string;
	competition: string;
	dateTime: string;
	errors: string[];
};

export type MatchImportParseResult = {
	rows: ParsedMatchImportRow[];
	fileErrors: string[];
};

const requiredHeaders = [
	"date",
	"time",
	"team",
	"opponent",
	"venue",
	"location",
	"competition",
] as const;

const headerAliases: Record<string, typeof requiredHeaders[number]> = {
	date: "date",
	match_date: "date",
	time: "time",
	kickoff: "time",
	kick_off: "time",
	team: "team",
	team_name: "team",
	opponent: "opponent",
	opposition: "opponent",
	venue: "venue",
	home_away: "venue",
	location: "location",
	ground: "location",
	competition: "competition",
};

export function parseMatchImportCsv(
	text: string,
	teamProfiles: ClubTeamProfile[],
	existingMatches: Match[] = []
): MatchImportParseResult {
	const records = parseCsvRecords(text);

	if (records.length === 0) {
		return { rows: [], fileErrors: ["The CSV file is empty."] };
	}

	const headerIndex = new Map<string, number>();
	records[0].forEach((rawHeader, index) => {
		const normalisedHeader = normaliseHeader(rawHeader);
		const canonicalHeader = headerAliases[normalisedHeader];

		if (canonicalHeader && !headerIndex.has(canonicalHeader)) {
			headerIndex.set(canonicalHeader, index);
		}
	});

	const missingHeaders = requiredHeaders.filter((header) => !headerIndex.has(header));

	if (missingHeaders.length > 0) {
		return {
			rows: [],
			fileErrors: [`Missing required columns: ${missingHeaders.join(", ")}.`],
		};
	}

	const existingKeys = new Set(
		existingMatches.map((match) =>
			buildDuplicateKey(match.team, match.opponent, new Date(match.date).toISOString())
		)
	);
	const importKeys = new Map<string, number>();
	const rows = records
		.slice(1)
		.map((record, index) => parseRow(record, index + 2, headerIndex, teamProfiles))
		.filter((row) => !isBlankRow(row));

	for (const row of rows) {
		if (row.errors.length > 0) {
			continue;
		}

		const key = buildDuplicateKey(row.teamId, row.opponent, row.dateTime);
		const firstRowNumber = importKeys.get(key);

		if (firstRowNumber) {
			row.errors.push(`Duplicates row ${firstRowNumber}.`);
			continue;
		}

		importKeys.set(key, row.rowNumber);

		if (existingKeys.has(key)) {
			row.errors.push("This match already exists in the selected season.");
		}
	}

	return {
		rows,
		fileErrors: rows.length === 0 ? ["The CSV file does not contain any match rows."] : [],
	};
}

function parseRow(
	record: string[],
	rowNumber: number,
	headerIndex: Map<string, number>,
	teamProfiles: ClubTeamProfile[]
): ParsedMatchImportRow {
	const value = (header: typeof requiredHeaders[number]) =>
		(record[headerIndex.get(header) ?? -1] ?? "").trim();
	const date = normaliseDate(value("date"));
	const time = normaliseTime(value("time"));
	const teamValue = value("team");
	const resolvedTeam = resolveTeam(teamValue, teamProfiles);
	const opponent = value("opponent");
	const venueValue = value("venue").toLowerCase();
	const venue = venueValue === "away" ? "away" : "home";
	const location = value("location");
	const competition = value("competition");
	const errors: string[] = [];

	if (!date) errors.push("Use a valid date (YYYY-MM-DD or DD/MM/YYYY).");
	if (!time) errors.push("Use a valid 24-hour time (HH:mm).");
	if (!resolvedTeam) errors.push(`Team “${teamValue || "blank"}” was not found.`);
	if (!opponent) errors.push("Opponent is required.");
	if (venueValue !== "home" && venueValue !== "away") {
		errors.push("Venue must be Home or Away.");
	}
	if (!location) errors.push("Location is required.");
	if (!competition) errors.push("Competition is required.");

	const dateTime = date && time ? localDateTimeToIso(date, time) : "";

	if (date && time && !dateTime) {
		errors.push("Date and time could not be read.");
	}

	return {
		rowNumber,
		date: date || value("date"),
		time: time || value("time"),
		teamId: resolvedTeam?.id ?? "",
		teamName: resolvedTeam?.displayName ?? teamValue,
		opponent,
		venue,
		location,
		competition,
		dateTime,
		errors,
	};
}

function parseCsvRecords(text: string) {
	const records: string[][] = [];
	let record: string[] = [];
	let field = "";
	let quoted = false;

	for (let index = 0; index < text.length; index++) {
		const character = text[index];
		const nextCharacter = text[index + 1];

		if (character === '"' && quoted && nextCharacter === '"') {
			field += '"';
			index++;
		} else if (character === '"') {
			quoted = !quoted;
		} else if (character === "," && !quoted) {
			record.push(field);
			field = "";
		} else if ((character === "\n" || character === "\r") && !quoted) {
			if (character === "\r" && nextCharacter === "\n") index++;
			record.push(field);
			if (record.some((value) => value.trim())) records.push(record);
			record = [];
			field = "";
		} else {
			field += character;
		}
	}

	record.push(field);
	if (record.some((value) => value.trim())) records.push(record);

	return records;
}

function normaliseHeader(value: string) {
	return value
		.replace(/^\uFEFF/, "")
		.trim()
		.toLowerCase()
		.replace(/[\s-]+/g, "_");
}

function normaliseDate(value: string) {
	let year: number;
	let month: number;
	let day: number;
	const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
	const ukMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);

	if (isoMatch) {
		[, year, month, day] = isoMatch.map(Number);
	} else if (ukMatch) {
		[, day, month, year] = ukMatch.map(Number);
	} else {
		return "";
	}

	const parsed = new Date(year, month - 1, day);
	if (
		parsed.getFullYear() !== year ||
		parsed.getMonth() !== month - 1 ||
		parsed.getDate() !== day
	) {
		return "";
	}

	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normaliseTime(value: string) {
	const match = /^(\d{1,2}):(\d{2})$/.exec(value);
	if (!match) return "";

	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (hours > 23 || minutes > 59) return "";

	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function localDateTimeToIso(date: string, time: string) {
	const parsed = new Date(`${date}T${time}:00`);
	return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function resolveTeam(value: string, teamProfiles: ClubTeamProfile[]) {
	const normalisedValue = value.trim().toLowerCase();
	const legacyTeamId = normaliseLegacyTeamId(value);

	return teamProfiles.find((team) => {
		return (
			team.isActive &&
			(
			team.id.toLowerCase() === legacyTeamId.toLowerCase() ||
			team.displayName.toLowerCase() === normalisedValue ||
			team.shortName.toLowerCase() === normalisedValue ||
			(normalisedValue === "first" && team.id === FIRST_TEAM_ID) ||
			(normalisedValue === "second" && team.id === SECOND_TEAM_ID)
			)
		);
	});
}

function buildDuplicateKey(teamId: string, opponent: string, dateTime: string) {
	return `${normaliseLegacyTeamId(teamId).toLowerCase()}|${opponent.trim().toLowerCase()}|${dateTime}`;
}

function isBlankRow(row: ParsedMatchImportRow) {
	return (
		!row.date &&
		!row.time &&
		!row.teamName &&
		!row.opponent &&
		!row.location &&
		!row.competition
	);
}
