import type {
	SocialGraphicTemplate,
	SocialGraphicTemplateRenderContext,
} from "../types";
import {
	drawAssetOrPlaceholder,
	drawCalendarIcon,
	drawClockIcon,
	drawEditorialBackground,
	drawEditorialBorder,
	drawEditorialSectionTitle,
	drawFittedText,
	drawLocationIcon,
	drawMultilineText,
	drawRoundedFrame,
	drawShieldPlaceholder,
	drawWrappedText,
	EDITORIAL_GOLD,
	EDITORIAL_WHITE,
	getTextField,
} from "./editorialCanvas";
import {
	parseEditableTemplateLayout,
	serializeEditableTemplateLayout,
	withElementTransform,
	withElementTransformAsync,
} from "./editableTemplateLayout";
import type { EditableTemplateLayout } from "./editableTemplateLayout";
import { getSponsorSlots } from "./sponsorLayout";

const MATCHDAY_SPONSOR_TOP = 1122;
const MATCHDAY_DETAIL_HEIGHT = 175;
const MATCHDAY_SPONSOR_FREE_HEIGHT = 1122;

export type MatchdayEditorialElementId =
	| "section-heading"
	| "headline"
	| "home-team"
	| "versus"
	| "away-team"
	| "match-details"
	| "sponsor-section";

export type MatchdayEditorialTemplateDefinition = EditableTemplateLayout<MatchdayEditorialElementId>;

export const matchdayEditorialDefaultDefinition: MatchdayEditorialTemplateDefinition = {
	version: 1,
	canvas: { width: 1365, height: 1365, sponsorFreeHeight: MATCHDAY_SPONSOR_FREE_HEIGHT },
	elements: {
		"section-heading": { x: 402, y: 38, width: 560, height: 72 },
		headline: { x: 68, y: 112, width: 1230, height: 210 },
		"home-team": { x: 155, y: 405, width: 430, height: 471 },
		versus: { x: 610, y: 530, width: 145, height: 160 },
		"away-team": { x: 853, y: 405, width: 430, height: 471 },
		"match-details": { x: 64, y: 895, width: 1237, height: MATCHDAY_DETAIL_HEIGHT },
		"sponsor-section": { x: 64, y: MATCHDAY_SPONSOR_TOP - 34, width: 1237, height: 260 },
	},
};

export const matchdayEditorialDefaultSource = serializeEditableTemplateLayout(
	matchdayEditorialDefaultDefinition
);

export const matchdayEditorialTemplate = createMatchdayEditorialTemplate();

export function createMatchdayEditorialTemplate(
	definition = matchdayEditorialDefaultDefinition
): SocialGraphicTemplate {
	return {
		id: "matchday-editorial-gold",
		name: "Editorial matchday",
		description: "Square black and gold fixture announcement with optional sponsors.",
		width: definition.canvas.width,
		height: definition.canvas.height,
		resolveHeight: (content) => content.fields.showSponsors === false
			? definition.canvas.sponsorFreeHeight
			: definition.canvas.height,
		supportedKinds: ["fixture"],
		fields: [
			{ id: "showSponsors", label: "Show sponsors area", type: "boolean", defaultValue: true },
			{ id: "sponsorsTitle", label: "Sponsors title", type: "text", defaultValue: "Proudly sponsored by" },
		],
		render: (context) => renderMatchdayEditorialTemplate(context, definition),
	};
}

export function parseMatchdayEditorialDefinition(source: string) {
	return parseEditableTemplateLayout(source, matchdayEditorialDefaultDefinition);
}

export const serializeMatchdayEditorialDefinition = serializeEditableTemplateLayout;

async function renderMatchdayEditorialTemplate({
	context,
	width,
	height,
	content,
}: SocialGraphicTemplateRenderContext, definition: MatchdayEditorialTemplateDefinition) {
	const fixture = content.fixtures[0];
	const showSponsors = content.fields.showSponsors !== false;

	context.save();
	drawEditorialBackground(context, width, height);
	drawEditorialBorder(context, width, height);

	if (!fixture) {
		drawMultilineText(context, "SELECT AN UPCOMING\nFIXTURE", width / 2, height / 2, 52, EDITORIAL_WHITE);
		context.restore();
		return;
	}

	withElementTransform(context, matchdayEditorialDefaultDefinition.elements["section-heading"], definition.elements["section-heading"], () => {
		drawEditorialSectionTitle(context, fixture.competition || "Fixture", 72, width, 560);
	});
	withElementTransform(context, matchdayEditorialDefaultDefinition.elements.headline, definition.elements.headline, () => {
		drawFittedText(context, content.headline.toUpperCase(), width / 2, 112, 1230, 210, 88, EDITORIAL_WHITE, "center");
	});

	const homeTeam = fixture.venue === "home" ? fixture.teamName : fixture.opponent;
	const awayTeam = fixture.venue === "away" ? fixture.teamName : fixture.opponent;

	await withElementTransformAsync(context, matchdayEditorialDefaultDefinition.elements["home-team"], definition.elements["home-team"], () => drawTeam(context, content.assets.homeTeamLogo, homeTeam, "HOME", 190, 425));
	await withElementTransformAsync(context, matchdayEditorialDefaultDefinition.elements["away-team"], definition.elements["away-team"], () => drawTeam(context, content.assets.awayTeamLogo, awayTeam, "AWAY", 888, 425));

	withElementTransform(context, matchdayEditorialDefaultDefinition.elements.versus, definition.elements.versus, () => {
		context.save();
		context.translate(width / 2, 610);
		context.rotate(-0.18);
		context.strokeStyle = EDITORIAL_GOLD;
		context.lineWidth = 4;
		context.beginPath();
		context.moveTo(-70, -68);
		context.lineTo(72, -68);
		context.moveTo(-72, 76);
		context.lineTo(70, 76);
		context.stroke();
		drawFittedText(context, "VS", 0, -48, 132, 100, 62, EDITORIAL_GOLD, "center");
		context.restore();
	});

	const detailTop = 895;
	withElementTransform(context, matchdayEditorialDefaultDefinition.elements["match-details"], definition.elements["match-details"], () => {
		drawRoundedFrame(context, 64, detailTop, 1237, MATCHDAY_DETAIL_HEIGHT, 20);
		drawMatchDetails(context, fixture.date, fixture.location, detailTop, MATCHDAY_DETAIL_HEIGHT);
	});

	if (showSponsors) {
		await withElementTransformAsync(context, matchdayEditorialDefaultDefinition.elements["sponsor-section"], definition.elements["sponsor-section"], async () => {
			drawEditorialSectionTitle(context, getTextField(content.fields.sponsorsTitle, "Proudly sponsored by"), MATCHDAY_SPONSOR_TOP, width, 530);
			const sponsorSlots = getSponsorSlots(content.assets.sponsors, 64, 1236, 33);
			await Promise.all(sponsorSlots.map((slot) => drawAssetOrPlaceholder(
				context,
				slot.asset,
				slot.x,
				MATCHDAY_SPONSOR_TOP + 48,
				slot.width,
				160,
				"SPONSOR\nPLACEHOLDER",
				{ contain: true }
			)));
		});
	}

	context.restore();
}

async function drawTeam(
	context: CanvasRenderingContext2D,
	asset: SocialGraphicTemplateRenderContext["content"]["assets"]["homeTeamLogo"],
	teamName: string,
	venueLabel: string,
	x: number,
	y: number
) {
	if (asset) {
		await drawAssetOrPlaceholder(context, asset, x - 35, y - 20, 360, 370, "", { frame: false, contain: true });
	} else {
		drawShieldPlaceholder(context, x - 5, y - 10, 300, 340);
	}
	drawFittedText(context, teamName.toUpperCase(), x + 145, y + 365, 420, 50, 26, EDITORIAL_WHITE, "center");
	drawFittedText(context, `(${venueLabel})`, x + 145, y + 421, 260, 30, 20, EDITORIAL_GOLD, "center");
}

function drawMatchDetails(
	context: CanvasRenderingContext2D,
	dateValue: string,
	location: string,
	y: number,
	height: number
) {
	const date = new Date(dateValue);
	const dateLabel = Number.isNaN(date.getTime())
		? "DATE TBC"
		: date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }).toUpperCase();
	const timeLabel = Number.isNaN(date.getTime())
		? "TIME TBC"
		: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	const iconTop = y + 22;
	const iconSize = 60;
	const textTop = y + 104;

	drawCalendarIcon(context, 273 - iconSize / 2, iconTop, iconSize);
	drawClockIcon(context, 682, iconTop + iconSize / 2, iconSize);
	const locationSize = 45;
	drawLocationIcon(context, 1090, iconTop + locationSize * 0.32, locationSize);

	drawFittedText(context, dateLabel, 273, textTop, 280, 37, 21, EDITORIAL_WHITE, "center");
	drawFittedText(context, timeLabel, 682, textTop, 250, 37, 21, EDITORIAL_WHITE, "center");
	drawWrappedText(context, location.toUpperCase(), 1090, textTop, 330, 2, 32, 17, EDITORIAL_WHITE, "center");

	context.strokeStyle = EDITORIAL_GOLD;
	context.lineWidth = 3;
	context.beginPath();
	context.moveTo(470, y + 28);
	context.lineTo(470, y + height - 28);
	context.moveTo(890, y + 28);
	context.lineTo(890, y + height - 28);
	context.stroke();
}
