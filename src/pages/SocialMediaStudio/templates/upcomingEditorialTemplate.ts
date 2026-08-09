import type {
	SocialFixture,
	SocialGraphicTemplate,
	SocialGraphicTemplateRenderContext,
} from "../types";
import {
	drawAssetOrPlaceholder,
	drawCalendarIcon,
	drawEditorialBackground,
	drawEditorialBorder,
	drawEditorialSectionTitle,
	drawFittedText,
	drawLocationIcon,
	drawMultilineText,
	drawRoundedFrame,
	drawShieldPlaceholder,
	drawWrappedText,
	getTextField,
} from "./editorialCanvas";

export type UpcomingEditorialTemplateDefinition = {
	version: 1;
	canvas: {
		width: number;
		height: number;
		sponsorFreeHeight: number;
	};
	theme: {
		background: string;
		accent: string;
		text: string;
	};
	header: {
		sectionTitle: string;
		sectionX: number;
		sectionY: number;
		sectionWidth: number;
		headlineX: number;
		headlineY: number;
		headlineWidth: number;
		headlineMaxFontSize: number;
		headlineMinFontSize: number;
		logoX: number;
		logoY: number;
		logoWidth: number;
		logoHeight: number;
	};
	fixtureList: {
		top: number;
		bottom: number;
		maximumRowHeight: number;
		rowGap: number;
		compactRowGap: number;
	};
	fixtureRow: {
		frameX: number;
		frameWidth: number;
		frameRadius: number;
		calendarX: number;
		calendarYRatio: number;
		calendarSize: number;
		dateX: number;
		dateYRatio: number;
		competitionYRatio: number;
		dateWidth: number;
		firstDividerX: number;
		clubLogoX: number;
		clubLogoCenterYRatio: number;
		clubLogoWidth: number;
		clubLogoHeight: number;
		versusX: number;
		versusYRatio: number;
		opponentX: number;
		opponentYRatio: number;
		opponentWidth: number;
		secondDividerX: number;
		locationIconX: number;
		locationIconYRatio: number;
		locationIconSize: number;
		locationX: number;
		venueYRatio: number;
		locationYRatio: number;
		locationWidth: number;
	};
	sponsors: {
		top: number;
		titleX: number;
		titleWidth: number;
		cardX: number;
		cardTopOffset: number;
		cardWidth: number;
		cardHeight: number;
		cardGap: number;
	};
};

export const upcomingEditorialDefaultDefinition: UpcomingEditorialTemplateDefinition = {
	version: 1,
	canvas: {
		width: 1365,
		height: 1651,
		sponsorFreeHeight: 1330,
	},
	theme: {
		background: "#050606",
		accent: "#d7a600",
		text: "#f4f4f2",
	},
	header: {
		sectionTitle: "Upcoming",
		sectionX: 682.5,
		sectionY: 88,
		sectionWidth: 430,
		headlineX: 66,
		headlineY: 126,
		headlineWidth: 970,
		headlineMaxFontSize: 212,
		headlineMinFontSize: 82,
		logoX: 1000,
		logoY: 45,
		logoWidth: 285,
		logoHeight: 345,
	},
	fixtureList: {
		top: 432,
		bottom: 1268,
		maximumRowHeight: 155,
		rowGap: 24,
		compactRowGap: 16,
	},
	fixtureRow: {
		frameX: 62,
		frameWidth: 1240,
		frameRadius: 18,
		calendarX: 102,
		calendarYRatio: 0.28,
		calendarSize: 68,
		dateX: 205,
		dateYRatio: 0.27,
		competitionYRatio: 0.58,
		dateWidth: 210,
		firstDividerX: 410,
		clubLogoX: 462,
		clubLogoCenterYRatio: 0.5,
		clubLogoWidth: 104,
		clubLogoHeight: 102,
		versusX: 598,
		versusYRatio: 0.35,
		opponentX: 660,
		opponentYRatio: 0.29,
		opponentWidth: 250,
		secondDividerX: 930,
		locationIconX: 980,
		locationIconYRatio: 0.36,
		locationIconSize: 40,
		locationX: 1030,
		venueYRatio: 0.28,
		locationYRatio: 0.53,
		locationWidth: 235,
	},
	sponsors: {
		top: 1330,
		titleX: 682.5,
		titleWidth: 520,
		cardX: 62,
		cardTopOffset: 56,
		cardWidth: 390,
		cardHeight: 204,
		cardGap: 35,
	},
};

export const upcomingEditorialDefaultSource = serializeUpcomingEditorialDefinition(
	upcomingEditorialDefaultDefinition
);

export const upcomingEditorialTemplate = createUpcomingEditorialTemplate();

export function createUpcomingEditorialTemplate(
	definition = upcomingEditorialDefaultDefinition
): SocialGraphicTemplate {
	return {
		id: "upcoming-editorial-gold",
		name: "Editorial fixtures",
		description: "Black and gold roundup for up to five upcoming fixtures.",
		width: definition.canvas.width,
		height: definition.canvas.height,
		resolveHeight: (content) => content.fields.showSponsors === false
			? definition.canvas.sponsorFreeHeight
			: definition.canvas.height,
		supportedKinds: ["upcomingFixtures"],
		fields: [
			{
				id: "showSponsors",
				label: "Show sponsors area",
				type: "boolean",
				defaultValue: true,
			},
			{
				id: "sponsorsTitle",
				label: "Sponsors title",
				type: "text",
				defaultValue: "Proudly sponsored by",
			},
		],
		render: (renderContext) => renderUpcomingEditorialTemplate(
			renderContext,
			definition
		),
	};
}

export function parseUpcomingEditorialDefinition(source: string) {
	let candidate: unknown;

	try {
		candidate = JSON.parse(source);
	} catch (error) {
		throw new Error(
			error instanceof SyntaxError ? error.message : "Template JSON is invalid.",
			{ cause: error }
		);
	}

	const definition = normaliseDefinition(
		candidate,
		upcomingEditorialDefaultDefinition,
		"template"
	) as UpcomingEditorialTemplateDefinition;

	if (definition.version !== 1) {
		throw new Error("template.version must be 1.");
	}

	return definition;
}

export function serializeUpcomingEditorialDefinition(
	definition: UpcomingEditorialTemplateDefinition
) {
	return JSON.stringify(definition, null, 2);
}

async function renderUpcomingEditorialTemplate(
	{
		context,
		width,
		height,
		content,
	}: SocialGraphicTemplateRenderContext,
	definition: UpcomingEditorialTemplateDefinition
) {
	const { theme, header, sponsors } = definition;
	const showSponsors = content.fields.showSponsors !== false;
	const fixtures = content.fixtures.slice(0, 5);

	context.save();
	drawEditorialBackground(context, width, height, {
		background: theme.background,
		accent: theme.accent,
	});
	drawEditorialBorder(context, width, height, theme.accent);
	drawEditorialSectionTitle(
		context,
		header.sectionTitle,
		header.sectionY,
		width,
		header.sectionWidth,
		theme.accent,
		header.sectionX
	);
	drawFittedText(
		context,
		content.headline.toUpperCase(),
		header.headlineX,
		header.headlineY,
		header.headlineWidth,
		header.headlineMaxFontSize,
		header.headlineMinFontSize,
		theme.text
	);
	await drawAssetOrPlaceholder(
		context,
		content.assets.homeTeamLogo,
		header.logoX,
		header.logoY,
		header.logoWidth,
		header.logoHeight,
		"YOUR\nLOGO\nHERE",
		{
			frame: false,
			contain: true,
			placeholderColour: theme.text,
		}
	);

	if (fixtures.length === 0) {
		drawMultilineText(
			context,
			"SELECT UPCOMING\nFIXTURES",
			width / 2,
			height / 2,
			54,
			theme.text
		);
		context.restore();
		return;
	}

	const rowLayouts = getUpcomingFixtureRowLayouts(definition, fixtures.length);

	for (let index = 0; index < fixtures.length; index += 1) {
		await drawFixtureRow(
			context,
			fixtures[index],
			content.assets.homeTeamLogo,
			rowLayouts[index].y,
			rowLayouts[index].height,
			definition
		);
	}

	if (showSponsors) {
		drawEditorialSectionTitle(
			context,
			getTextField(content.fields.sponsorsTitle, "Proudly sponsored by"),
			sponsors.top,
			width,
			sponsors.titleWidth,
			theme.accent,
			sponsors.titleX
		);
		await Promise.all(content.assets.sponsors.slice(0, 3).map((asset, index) => (
			drawAssetOrPlaceholder(
				context,
				asset,
				sponsors.cardX + index * (sponsors.cardWidth + sponsors.cardGap),
				sponsors.top + sponsors.cardTopOffset,
				sponsors.cardWidth,
				sponsors.cardHeight,
				"SPONSOR\nPLACEHOLDER",
				{
					contain: true,
					frameColour: theme.accent,
					placeholderColour: theme.text,
				}
			)
		)));
	}

	context.restore();
}

async function drawFixtureRow(
	context: CanvasRenderingContext2D,
	fixture: SocialFixture,
	clubLogo: SocialGraphicTemplateRenderContext["content"]["assets"]["homeTeamLogo"],
	y: number,
	height: number,
	definition: UpcomingEditorialTemplateDefinition
) {
	const { theme, fixtureRow: row } = definition;
	drawRoundedFrame(
		context,
		row.frameX,
		y,
		row.frameWidth,
		height,
		row.frameRadius,
		theme.accent
	);
	drawCalendarIcon(
		context,
		row.calendarX,
		y + height * row.calendarYRatio,
		row.calendarSize,
		theme.accent
	);

	const date = new Date(fixture.date);
	const dateText = Number.isNaN(date.getTime())
		? "DATE TBC"
		: date.toLocaleDateString([], {
			weekday: "short",
			day: "numeric",
			month: "short",
		}).toUpperCase();
	drawFittedText(context, dateText, row.dateX, y + height * row.dateYRatio, row.dateWidth, 34, 20, theme.text);
	drawFittedText(context, fixture.competition.toUpperCase(), row.dateX, y + height * row.competitionYRatio, row.dateWidth, 27, 17, theme.accent);
	drawVerticalDivider(context, row.firstDividerX, y + 24, height - 48, theme.accent);

	if (clubLogo) {
		await drawAssetOrPlaceholder(
			context,
			clubLogo,
			row.clubLogoX,
			y + height * row.clubLogoCenterYRatio - row.clubLogoHeight / 2,
			row.clubLogoWidth,
			row.clubLogoHeight,
			"",
			{ frame: false, contain: true }
		);
	} else {
		drawShieldPlaceholder(
			context,
			row.clubLogoX + 20,
			y + height * row.clubLogoCenterYRatio - 38,
			66,
			76,
			theme.accent
		);
	}
	drawFittedText(context, "VS", row.versusX, y + height * row.versusYRatio, 52, 38, 24, theme.accent, "center");
	drawFittedText(context, fixture.opponent.toUpperCase(), row.opponentX, y + height * row.opponentYRatio, row.opponentWidth, 38, 20, theme.text);
	drawVerticalDivider(context, row.secondDividerX, y + 24, height - 48, theme.accent);

	drawLocationIcon(
		context,
		row.locationIconX,
		y + height * row.locationIconYRatio,
		row.locationIconSize,
		theme.accent,
		theme.background
	);
	drawFittedText(context, fixture.venue.toUpperCase(), row.locationX, y + height * row.venueYRatio, row.locationWidth, 30, 20, theme.accent);
	drawWrappedText(context, fixture.location.toUpperCase(), row.locationX, y + height * row.locationYRatio, row.locationWidth, 2, 20, 15, theme.text);
}

export function getUpcomingFixtureRowLayouts(
	definition: UpcomingEditorialTemplateDefinition,
	fixtureCount: number
) {
	if (fixtureCount <= 0) return [];
	const { fixtureList } = definition;
	const rowGap = fixtureCount > 3
		? fixtureList.compactRowGap
		: fixtureList.rowGap;
	const rowHeight = Math.min(
		fixtureList.maximumRowHeight,
		(fixtureList.bottom - fixtureList.top - rowGap * (fixtureCount - 1)) /
			fixtureCount
	);
	const groupHeight = rowHeight * fixtureCount + rowGap * (fixtureCount - 1);
	const firstRowTop = fixtureList.top +
		(fixtureList.bottom - fixtureList.top - groupHeight) / 2;

	return Array.from({ length: fixtureCount }, (_, index) => ({
		y: firstRowTop + index * (rowHeight + rowGap),
		height: rowHeight,
	}));
}

function drawVerticalDivider(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	height: number,
	colour: string
) {
	context.strokeStyle = colour;
	context.lineWidth = 3;
	context.beginPath();
	context.moveTo(x, y);
	context.lineTo(x, y + height);
	context.stroke();
}

const migratedFixtureRowFields = new Set([
	"calendarYRatio",
	"dateYRatio",
	"competitionYRatio",
	"clubLogoCenterYRatio",
	"versusYRatio",
	"opponentYRatio",
	"locationIconYRatio",
	"locationIconSize",
	"venueYRatio",
	"locationYRatio",
]);

function normaliseDefinition(
	candidate: unknown,
	fallback: unknown,
	path: string
): unknown {
	if (typeof fallback === "number") {
		const allowsZero = /(X|Y|top|bottom|Gap|Offset|Ratio)$/.test(path);
		if (
			typeof candidate !== "number" ||
			!Number.isFinite(candidate) ||
			candidate < (allowsZero ? 0 : 0.1) ||
			candidate > 4000
		) {
			throw new Error(`${path} must be a number between 0 and 4000.`);
		}
		return candidate;
	}

	if (typeof fallback === "string") {
		if (typeof candidate !== "string" || !candidate.trim()) {
			throw new Error(`${path} must be a non-empty string.`);
		}
		if (path.startsWith("template.theme.") && !/^#[0-9a-f]{6}$/i.test(candidate)) {
			throw new Error(`${path} must be a six-digit hex colour.`);
		}
		return candidate;
	}

	if (!isObject(candidate) || !isObject(fallback)) {
		throw new Error(`${path} must be an object.`);
	}

	return Object.fromEntries(
		Object.entries(fallback).map(([key, fallbackValue]) => {
			if (!(key in candidate)) {
				if (migratedFixtureRowFields.has(key) && path === "template.fixtureRow") {
					return [key, fallbackValue];
				}
				throw new Error(`${path}.${key} is required.`);
			}
			return [
				key,
				normaliseDefinition(candidate[key], fallbackValue, `${path}.${key}`),
			];
		})
	);
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
