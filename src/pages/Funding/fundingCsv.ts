import type {
	FundingOpportunity,
	FundingOpportunityStatus,
	SaveFundingOpportunityRequest,
} from "../../types/funding";

export const fundingImportTemplate = [
	"name,description,amount,application_url,start_date,end_date,status",
	'Community Football Fund,"Support for equipment and facility improvements.","Up to £10,000",https://example.org/fund,2026-09-01,2026-10-31,Open',
].join("\n");

export type ParsedFundingImportRow = SaveFundingOpportunityRequest & {
	rowNumber: number;
	rawStatus: string;
	errors: string[];
};

export type FundingImportParseResult = {
	rows: ParsedFundingImportRow[];
	fileErrors: string[];
};

const requiredHeaders = [
	"name",
	"description",
	"amount",
	"application_url",
	"start_date",
	"end_date",
	"status",
] as const;

type FundingHeader = typeof requiredHeaders[number];

const headerAliases: Record<string, FundingHeader> = {
	name: "name",
	title: "name",
	description: "description",
	details: "description",
	amount: "amount",
	funding_amount: "amount",
	application_url: "application_url",
	application_link: "application_url",
	url: "application_url",
	link: "application_url",
	start_date: "start_date",
	opening_date: "start_date",
	end_date: "end_date",
	closing_date: "end_date",
	deadline: "end_date",
	status: "status",
};

export function parseFundingImportCsv(
	text: string,
	existingOpportunities: FundingOpportunity[] = []
): FundingImportParseResult {
	const records = parseCsvRecords(text);
	if (records.length === 0) {
		return { rows: [], fileErrors: ["The CSV file is empty."] };
	}

	const headerIndex = new Map<FundingHeader, number>();
	records[0].forEach((rawHeader, index) => {
		const canonicalHeader = headerAliases[normaliseHeader(rawHeader)];
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

	const existingKeys = new Set(existingOpportunities.map(buildExistingDuplicateKey));
	const importKeys = new Map<string, number>();
	const rows = records
		.slice(1)
		.map((record, index) => parseRow(record, index + 2, headerIndex))
		.filter((row) => !isBlankRow(row));

	for (const row of rows) {
		if (row.errors.length > 0) continue;
		const key = buildDuplicateKey(row.name, row.applicationUrl);
		const firstRow = importKeys.get(key);
		if (firstRow) {
			row.errors.push(`Duplicates row ${firstRow}.`);
			continue;
		}
		importKeys.set(key, row.rowNumber);
		if (existingKeys.has(key)) {
			row.errors.push("This opportunity already exists.");
		}
	}

	return {
		rows,
		fileErrors: rows.length === 0 ? ["The CSV file does not contain any funding rows."] : [],
	};
}

function parseRow(record: string[], rowNumber: number, headerIndex: Map<FundingHeader, number>): ParsedFundingImportRow {
	const value = (header: FundingHeader) => (record[headerIndex.get(header) ?? -1] ?? "").trim();
	const name = value("name");
	const description = value("description");
	const amount = value("amount");
	const applicationUrl = value("application_url");
	const rawStartDate = value("start_date");
	const rawEndDate = value("end_date");
	const rawStatus = value("status");
	const startDate = normaliseDate(rawStartDate);
	const endDate = normaliseDate(rawEndDate);
	const status = normaliseStatus(rawStatus);
	const errors: string[] = [];

	if (!name) errors.push("Name is required.");
	if (applicationUrl && !isHttpUrl(applicationUrl)) errors.push("Application URL must use http or https.");
	if (rawStartDate && !startDate) errors.push("Start date must be YYYY-MM-DD or DD/MM/YYYY.");
	if (rawEndDate && !endDate) errors.push("End date must be YYYY-MM-DD or DD/MM/YYYY.");
	if (startDate && endDate && endDate < startDate) errors.push("End date cannot be before the start date.");
	if (!status) errors.push("Status must be Open, Upcoming, Rolling, Restricted or Closed.");

	return {
		rowNumber,
		name,
		description,
		amount,
		applicationUrl,
		startDate: startDate || null,
		endDate: endDate || null,
		status: status ?? "Open",
		statusDetail: rawStatus,
		applicationState: "Investigating",
		notes: "",
		rawStatus,
		errors,
	};
}

function normaliseStatus(value: string): FundingOpportunityStatus | null {
	const normalised = value.trim().toLowerCase();
	if (normalised === "open") return "Open";
	if (normalised === "upcoming") return "Upcoming";
	if (normalised === "rolling") return "Rolling";
	if (normalised.startsWith("restricted")) return "Restricted";
	if (normalised.startsWith("closed")) return "Closed";
	return null;
}

function normaliseDate(value: string) {
	if (!value) return "";
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

	const parsed = new Date(Date.UTC(year, month - 1, day));
	if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return "";
	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
			if (record.some((entry) => entry.trim())) records.push(record);
			record = [];
			field = "";
		} else {
			field += character;
		}
	}

	record.push(field);
	if (record.some((entry) => entry.trim())) records.push(record);
	return records;
}

function normaliseHeader(value: string) {
	return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function isHttpUrl(value: string) {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

function buildExistingDuplicateKey(opportunity: FundingOpportunity) {
	return buildDuplicateKey(opportunity.name, opportunity.applicationUrl);
}

function buildDuplicateKey(name: string, applicationUrl: string) {
	return `${name.trim().toLowerCase()}|${applicationUrl.trim().toLowerCase()}`;
}

function isBlankRow(row: ParsedFundingImportRow) {
	return !row.name && !row.description && !row.amount && !row.applicationUrl && !row.rawStatus;
}
