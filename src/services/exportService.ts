export type ExportColumn<Row> = {
	label: string;
	getValue: (row: Row) => string | number;
};

export function buildSeparatedTableText<Row>({
	rows,
	columns,
	separator,
}: {
	rows: Row[];
	columns: ExportColumn<Row>[];
	separator: string;
}) {
	const header = columns.map((column) => column.label).join(separator);

	const body = rows
		.map((row) =>
			columns
				.map((column) => String(column.getValue(row)))
				.join(separator)
		)
		.join("\n");

	return [header, body].filter(Boolean).join("\n");
}

export function buildCsvText<Row>({
	rows,
	columns,
}: {
	rows: Row[];
	columns: ExportColumn<Row>[];
}) {
	const header = columns
		.map((column) => escapeCsvValue(column.label))
		.join(",");

	const body = rows
		.map((row) =>
			columns
				.map((column) => escapeCsvValue(column.getValue(row)))
				.join(",")
		)
		.join("\n");

	return [header, body].filter(Boolean).join("\n");
}

export function downloadTextFile({
	filename,
	content,
	mimeType,
}: {
	filename: string;
	content: string;
	mimeType: string;
}) {
	const blob = new Blob([content], {
		type: mimeType,
	});

	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");

	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	URL.revokeObjectURL(url);
}

export function slugify(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function escapeCsvValue(value: string | number) {
	const stringValue = String(value);

	if (
		stringValue.includes(",") ||
		stringValue.includes('"') ||
		stringValue.includes("\n")
	) {
		return `"${stringValue.replace(/"/g, '""')}"`;
	}

	return stringValue;
}