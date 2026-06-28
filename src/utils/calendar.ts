import type { ClubEvent } from "../types/events";

const CALENDAR_PRODUCT_ID = "-//Yepset//Events//EN";
const DEFAULT_EVENT_DURATION_MINUTES = 90;

export function downloadClubEventCalendarFile(event: ClubEvent) {
	const content = createClubEventCalendarFile(event);
	const filename = `${getSafeFilename(event.title || "event")}.ics`;
	const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");

	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

export function createClubEventCalendarFile(event: ClubEvent) {
	const startDate = parseCalendarDate(event.startDateTime);
	const endDate = getCalendarEndDate(event, startDate);
	const updatedAt = parseCalendarDate(event.updatedAt) ?? new Date();
	const createdAt = parseCalendarDate(event.createdAt) ?? updatedAt;
	const descriptionParts = [event.description, getEventTypeDescription(event)].filter(Boolean);

	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		`PRODID:${CALENDAR_PRODUCT_ID}`,
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		"BEGIN:VEVENT",
		`UID:kingsmanage-event-${event.id}@kingsmanage`,
		`DTSTAMP:${formatCalendarDate(new Date())}`,
		`CREATED:${formatCalendarDate(createdAt)}`,
		`LAST-MODIFIED:${formatCalendarDate(updatedAt)}`,
		`SUMMARY:${escapeCalendarText(event.title || "Kingsbridge Colts event")}`,
	];

	if (startDate) {
		lines.push(`DTSTART:${formatCalendarDate(startDate)}`);
	}

	if (endDate) {
		lines.push(`DTEND:${formatCalendarDate(endDate)}`);
	}

	if (event.location) {
		lines.push(`LOCATION:${escapeCalendarText(event.location)}`);
	}

	if (descriptionParts.length > 0) {
		lines.push(`DESCRIPTION:${escapeCalendarText(descriptionParts.join("\n\n"))}`);
	}

	lines.push("END:VEVENT", "END:VCALENDAR");

	return lines.map(foldCalendarLine).join("\r\n") + "\r\n";
}

function parseCalendarDate(value?: string | null) {
	if (!value) {
		return null;
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return null;
	}

	return date;
}

function getCalendarEndDate(event: ClubEvent, startDate: Date | null) {
	const explicitEndDate = parseCalendarDate(event.endDateTime);

	if (explicitEndDate && startDate && explicitEndDate > startDate) {
		return explicitEndDate;
	}

	if (!startDate) {
		return null;
	}

	return new Date(startDate.getTime() + DEFAULT_EVENT_DURATION_MINUTES * 60_000);
}

function formatCalendarDate(date: Date) {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	const hours = String(date.getUTCHours()).padStart(2, "0");
	const minutes = String(date.getUTCMinutes()).padStart(2, "0");
	const seconds = String(date.getUTCSeconds()).padStart(2, "0");

	return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function escapeCalendarText(value: string) {
	return value
		.replace(/\\/g, "\\\\")
		.replace(/\r?\n/g, "\\n")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,");
}

function foldCalendarLine(line: string) {
	const maxLineLength = 73;

	if (line.length <= maxLineLength) {
		return line;
	}

	const parts: string[] = [];
	let remainingLine = line;

	while (remainingLine.length > maxLineLength) {
		parts.push(remainingLine.slice(0, maxLineLength));
		remainingLine = remainingLine.slice(maxLineLength);
	}

	parts.push(remainingLine);

	return parts.join("\r\n ");
}

function getSafeFilename(value: string) {
	const safeValue = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	return safeValue || "event";
}

function getEventTypeDescription(event: ClubEvent) {
	if (event.type === "Match") {
		return "Created from Yepset match event.";
	}

	return "Created from Yepset event.";
}
