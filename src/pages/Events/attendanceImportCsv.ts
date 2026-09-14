import type { Player } from "../../stores/players";
import type { ClubEventAvailabilityStatus } from "../../types/events";

export type AttendanceImportMatchKind =
	| "exact"
	| "strong"
	| "review"
	| "manual"
	| "unmatched";

export type AttendanceImportRow = {
	rowNumber: number;
	sourceName: string;
	status: ClubEventAvailabilityStatus;
	playerId: string;
	playerName: string;
	matchScore: number;
	matchKind: AttendanceImportMatchKind;
};

export type AttendanceImportParseResult = {
	rows: AttendanceImportRow[];
	fileErrors: string[];
};

export function parseAttendanceImportCsv(
	text: string,
	players: Player[]
): AttendanceImportParseResult {
	const records = parseCsvRecords(text);
	if (records.length === 0) {
		return { rows: [], fileErrors: ["The CSV file is empty."] };
	}

	const rows: AttendanceImportRow[] = [];
	let currentStatus: ClubEventAvailabilityStatus | null = null;
	let nameColumn = 0;

	for (let index = 0; index < records.length; index++) {
		const record = records[index];
		const firstValue = (record[0] ?? "").trim();
		const sectionStatus = getSectionStatus(firstValue);

		if (sectionStatus) {
			currentStatus = sectionStatus;
			continue;
		}

		if (!currentStatus) continue;

		const headerIndex = record.findIndex(
			(value) => normaliseName(value) === "name"
		);
		if (headerIndex >= 0) {
			nameColumn = headerIndex;
			continue;
		}

		const sourceName = (record[nameColumn] ?? "").trim();
		if (!sourceName) continue;

		const match = findBestPlayerMatch(sourceName, players);
		rows.push({
			rowNumber: index + 1,
			sourceName,
			status: currentStatus,
			playerId: match?.player.id ?? "",
			playerName: match?.player.name ?? "",
			matchScore: match?.score ?? 0,
			matchKind: match?.kind ?? "unmatched",
		});
	}

	return {
		rows,
		fileErrors:
			rows.length > 0
				? []
				: [
						"No attendance rows were found. Expected Going, Unanswered or Can't go sections.",
					],
	};
}

export function findBestPlayerMatch(sourceName: string, players: Player[]) {
	const ranked = players
		.map((player) => ({
			player,
			score: getNameSimilarity(sourceName, player.name),
		}))
		.sort((first, second) => second.score - first.score);
	const best = ranked[0];
	if (!best) return null;

	const runnerUpScore = ranked[1]?.score ?? 0;
	const hasClearLead = best.score - runnerUpScore >= 0.05;
	if (best.score < 0.7 || (!hasClearLead && best.score < 0.98)) return null;

	return {
		...best,
		kind: best.score >= 0.98
			? "exact"
			: best.score >= 0.82
				? "strong"
				: "review",
	} as const;
}

export function getNameSimilarity(firstName: string, secondName: string) {
	const first = normaliseName(firstName);
	const second = normaliseName(secondName);
	if (!first || !second) return 0;
	if (first === second) return 1;

	const firstTokens = first.split(" ");
	const secondTokens = second.split(" ");
	let score = editSimilarity(first, second);

	const shorterTokens =
		firstTokens.length <= secondTokens.length ? firstTokens : secondTokens;
	const longerTokens =
		firstTokens.length <= secondTokens.length ? secondTokens : firstTokens;
	if (shorterTokens.every((token) => longerTokens.includes(token))) {
		score = Math.max(score, shorterTokens.length === 1 ? 0.86 : 0.92);
	}

	if (firstTokens.length > 1 && secondTokens.length > 1) {
		const firstLastName = firstTokens[firstTokens.length - 1];
		const secondLastName = secondTokens[secondTokens.length - 1];
		if (firstLastName === secondLastName) {
			score = Math.max(
				score,
				0.72 + 0.28 * editSimilarity(firstTokens[0], secondTokens[0])
			);
		}
	}

	return Math.min(1, score);
}

function getSectionStatus(value: string): ClubEventAvailabilityStatus | null {
	const normalised = normaliseName(value).replace(/\s+\d+$/, "");
	if (normalised === "going") return "Available";
	if (normalised === "unanswered") return "Unanswered";
	if (
		normalised === "cant go" ||
		normalised === "cannot go" ||
		normalised === "declined" ||
		normalised === "not going"
	) {
		return "Declined";
	}
	return null;
}

function normaliseName(value: string) {
	return value
		.replace(/^\uFEFF/, "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[’']/g, "")
		.replace(/[^a-z0-9]+/g, " ")
		.trim()
		.replace(/\s+/g, " ");
}

function editSimilarity(first: string, second: string) {
	const maxLength = Math.max(first.length, second.length);
	if (maxLength === 0) return 1;
	return 1 - levenshteinDistance(first, second) / maxLength;
}

function levenshteinDistance(first: string, second: string) {
	const previous = Array.from({ length: second.length + 1 }, (_, index) => index);

	for (let firstIndex = 1; firstIndex <= first.length; firstIndex++) {
		const current = [firstIndex];
		for (let secondIndex = 1; secondIndex <= second.length; secondIndex++) {
			current[secondIndex] = Math.min(
				current[secondIndex - 1] + 1,
				previous[secondIndex] + 1,
				previous[secondIndex - 1] +
					(first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1)
			);
		}
		previous.splice(0, previous.length, ...current);
	}

	return previous[second.length];
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
