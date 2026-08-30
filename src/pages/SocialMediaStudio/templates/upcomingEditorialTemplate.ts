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
import { getSponsorSlots } from "./sponsorLayout";

export const UPCOMING_FIXTURE_LIMIT = 8;

export type UpcomingEditorialFixtureRowDefinition = {
	frameX: number;
	frameWidth: number;
	frameRadius: number;
	calendarX: number;
	calendarYRatio: number;
	calendarSize: number;
	dateX: number;
	dateYRatio: number;
	dateWidth: number;
	competitionX: number;
	competitionYRatio: number;
	competitionWidth: number;
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
	venueX: number;
	venueYRatio: number;
	venueWidth: number;
	locationX: number;
	locationYRatio: number;
	locationWidth: number;
};

export type UpcomingEditorialFixtureRowOverride = {
	unlocked: boolean;
	values: Partial<UpcomingEditorialFixtureRowDefinition>;
};

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
	fixtureRow: UpcomingEditorialFixtureRowDefinition;
	fixtureRowOverrides: Array<UpcomingEditorialFixtureRowOverride | null>;
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
		dateWidth: 210,
		competitionX: 205,
		competitionYRatio: 0.58,
		competitionWidth: 210,
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
		venueX: 1030,
		venueYRatio: 0.28,
		venueWidth: 235,
		locationX: 1030,
		locationYRatio: 0.53,
		locationWidth: 235,
	},
	fixtureRowOverrides: [],
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
		description: `Black and gold roundup for up to ${UPCOMING_FIXTURE_LIMIT} upcoming fixtures.`,
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
	const fixtures = content.fixtures.slice(0, UPCOMING_FIXTURE_LIMIT);

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
			index,
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
		const sponsorAreaWidth = sponsors.cardWidth * 3 + sponsors.cardGap * 2;
		const sponsorSlots = getSponsorSlots(
			content.assets.sponsors,
			sponsors.cardX,
			sponsorAreaWidth,
			sponsors.cardGap
		);
		await Promise.all(sponsorSlots.map((slot) => (
			drawAssetOrPlaceholder(
				context,
				slot.asset,
				slot.x,
				sponsors.top + sponsors.cardTopOffset,
				slot.width,
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
	rowIndex: number,
	definition: UpcomingEditorialTemplateDefinition
) {
	const { theme } = definition;
	const row = getUpcomingFixtureRowDefinition(definition, rowIndex);
	const rowPadding = Math.max(7, Math.min(24, height * 0.12));
	const dividerPadding = Math.max(9, Math.min(24, height * 0.16));
	drawRoundedFrame(
		context,
		row.frameX,
		y,
		row.frameWidth,
		height,
		Math.min(row.frameRadius, height * 0.2),
		theme.accent
	);

	context.save();
	context.beginPath();
	context.rect(
		row.frameX + 3,
		y + 3,
		Math.max(1, row.frameWidth - 6),
		Math.max(1, height - 6)
	);
	context.clip();

	const calendarSize = Math.min(
		row.calendarSize,
		Math.max(20, height - rowPadding * 2)
	);
	const calendarY = clampRowElementTop(
		height * row.calendarYRatio,
		calendarSize,
		height,
		rowPadding
	);
	drawCalendarIcon(
		context,
		row.calendarX,
		y + calendarY,
		calendarSize,
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
	const dateTop = clampRowTextTop(height * row.dateYRatio, height, rowPadding);
	const competitionTop = clampRowTextTop(
		height * row.competitionYRatio,
		height,
		rowPadding
	);
	drawWrappedText(
		context,
		dateText,
		row.dateX,
		y + dateTop,
		row.dateWidth,
		2,
		34,
		11,
		theme.text,
		"left",
		Math.max(10, competitionTop - dateTop - 4)
	);
	drawWrappedText(
		context,
		fixture.competition.toUpperCase(),
		row.competitionX,
		y + competitionTop,
		row.competitionWidth,
		2,
		27,
		9,
		theme.accent,
		"left",
		Math.max(10, height - competitionTop - rowPadding)
	);
	drawVerticalDivider(
		context,
		row.firstDividerX,
		y + dividerPadding,
		Math.max(1, height - dividerPadding * 2),
		theme.accent
	);

	const logoScale = Math.min(
		1,
		Math.max(0.2, (height - rowPadding * 2) / row.clubLogoHeight)
	);
	const clubLogoWidth = row.clubLogoWidth * logoScale;
	const clubLogoHeight = row.clubLogoHeight * logoScale;
	const clubLogoX = row.clubLogoX + (row.clubLogoWidth - clubLogoWidth) / 2;
	if (clubLogo) {
		await drawAssetOrPlaceholder(
			context,
			clubLogo,
			clubLogoX,
			y + height * row.clubLogoCenterYRatio - clubLogoHeight / 2,
			clubLogoWidth,
			clubLogoHeight,
			"",
			{ frame: false, contain: true }
		);
	} else {
		const shieldWidth = 66 * logoScale;
		const shieldHeight = 76 * logoScale;
		drawShieldPlaceholder(
			context,
			row.clubLogoX + (row.clubLogoWidth - shieldWidth) / 2,
			y + height * row.clubLogoCenterYRatio - shieldHeight / 2,
			shieldWidth,
			shieldHeight,
			theme.accent
		);
	}
	const versusFontSize = Math.min(38, Math.max(16, height * 0.25));
	const versusTop = clampRowElementTop(
		height * row.versusYRatio,
		versusFontSize,
		height,
		rowPadding
	);
	drawFittedText(
		context,
		"VS",
		row.versusX,
		y + versusTop,
		52,
		versusFontSize,
		Math.min(16, versusFontSize),
		theme.accent,
		"center"
	);
	const opponentTop = clampRowTextTop(
		height * row.opponentYRatio,
		height,
		rowPadding
	);
	drawWrappedText(
		context,
		fixture.opponent.toUpperCase(),
		row.opponentX,
		y + opponentTop,
		row.opponentWidth,
		2,
		38,
		11,
		theme.text,
		"left",
		Math.max(10, height - opponentTop - rowPadding)
	);
	drawVerticalDivider(
		context,
		row.secondDividerX,
		y + dividerPadding,
		Math.max(1, height - dividerPadding * 2),
		theme.accent
	);

	const locationIconSize = Math.min(
		row.locationIconSize,
		Math.max(18, height * 0.28)
	);
	const locationIconY = clampRowElementTop(
		height * row.locationIconYRatio,
		locationIconSize,
		height,
		rowPadding
	);
	drawLocationIcon(
		context,
		row.locationIconX,
		y + locationIconY,
		locationIconSize,
		theme.accent,
		theme.background
	);
	const venueTop = clampRowTextTop(height * row.venueYRatio, height, rowPadding);
	const locationTop = clampRowTextTop(
		height * row.locationYRatio,
		height,
		rowPadding
	);
	drawWrappedText(
		context,
		fixture.venue.toUpperCase(),
		row.venueX,
		y + venueTop,
		row.venueWidth,
		2,
		30,
		10,
		theme.accent,
		"left",
		Math.max(10, locationTop - venueTop - 3)
	);
	drawWrappedText(
		context,
		fixture.location.toUpperCase(),
		row.locationX,
		y + locationTop,
		row.locationWidth,
		2,
		20,
		9,
		theme.text,
		"left",
		Math.max(10, height - locationTop - rowPadding)
	);
	context.restore();
}

function clampRowElementTop(
	top: number,
	elementHeight: number,
	rowHeight: number,
	padding: number
) {
	return Math.max(
		padding,
		Math.min(top, Math.max(padding, rowHeight - padding - elementHeight))
	);
}

function clampRowTextTop(top: number, rowHeight: number, padding: number) {
	return Math.max(padding, Math.min(top, Math.max(padding, rowHeight - padding - 10)));
}

export function getUpcomingFixtureRowDefinition(
	definition: UpcomingEditorialTemplateDefinition,
	rowIndex: number
): UpcomingEditorialFixtureRowDefinition {
	const override = definition.fixtureRowOverrides[rowIndex];
	return override?.unlocked
		? { ...definition.fixtureRow, ...override.values }
		: definition.fixtureRow;
}

export function isUpcomingFixtureRowUnlocked(
	definition: UpcomingEditorialTemplateDefinition,
	rowIndex: number
) {
	return definition.fixtureRowOverrides[rowIndex]?.unlocked === true;
}

export function setUpcomingFixtureRowUnlocked(
	definition: UpcomingEditorialTemplateDefinition,
	rowIndex: number,
	unlocked: boolean
): UpcomingEditorialTemplateDefinition {
	const fixtureRowOverrides = [...definition.fixtureRowOverrides];
	fixtureRowOverrides[rowIndex] = {
		unlocked,
		values: { ...(fixtureRowOverrides[rowIndex]?.values ?? {}) },
	};
	return { ...definition, fixtureRowOverrides };
}

export function getUpcomingFixtureRowLayouts(
	definition: UpcomingEditorialTemplateDefinition,
	fixtureCount: number
) {
	if (fixtureCount <= 0) return [];
	const { fixtureList } = definition;
	const minimumGap = fixtureCount > 3
		? fixtureList.compactRowGap
		: fixtureList.rowGap;
	const availableHeight = fixtureList.bottom - fixtureList.top;
	const rowHeight = Math.min(
		fixtureList.maximumRowHeight,
		Math.max(
			1,
			(availableHeight - minimumGap * (fixtureCount + 1)) / fixtureCount
		)
	);
	const rowGap = Math.max(
		0,
		(availableHeight - rowHeight * fixtureCount) / (fixtureCount + 1)
	);
	const firstRowTop = fixtureList.top + rowGap;

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
	"competitionX",
	"competitionYRatio",
	"competitionWidth",
	"clubLogoCenterYRatio",
	"versusYRatio",
	"opponentYRatio",
	"locationIconYRatio",
	"locationIconSize",
	"venueX",
	"venueYRatio",
	"venueWidth",
	"locationYRatio",
]);

function normaliseDefinition(
	candidate: unknown,
	fallback: unknown,
	path: string
): unknown {
	if (path === "template.fixtureRowOverrides") {
		return normaliseFixtureRowOverrides(candidate, path);
	}
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
				if (key === "fixtureRowOverrides" && path === "template") {
					return [key, fallbackValue];
				}
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

function normaliseFixtureRowOverrides(candidate: unknown, path: string) {
	if (!Array.isArray(candidate)) {
		throw new Error(`${path} must be an array.`);
	}
	if (candidate.length > 5) {
		throw new Error(`${path} can contain at most five row overrides.`);
	}

	return candidate.map((entry, index) => {
		if (entry === null) return null;
		if (!isObject(entry) || typeof entry.unlocked !== "boolean" || !isObject(entry.values)) {
			throw new Error(`${path}.${index} must contain unlocked and values.`);
		}
		const values = Object.fromEntries(Object.entries(entry.values).map(([key, value]) => {
			if (!(key in upcomingEditorialDefaultDefinition.fixtureRow)) {
				throw new Error(`${path}.${index}.values.${key} is not supported.`);
			}
			const fallback = upcomingEditorialDefaultDefinition.fixtureRow[
				key as keyof UpcomingEditorialFixtureRowDefinition
			];
			return [
				key,
				normaliseDefinition(value, fallback, `${path}.${index}.values.${key}`),
			];
		}));
		return { unlocked: entry.unlocked, values };
	});
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
