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

const MATCHDAY_SPONSOR_TOP = 1122;
const MATCHDAY_DETAIL_HEIGHT = 175;
const MATCHDAY_SPONSOR_FREE_HEIGHT = 1122;

export const matchdayEditorialTemplate: SocialGraphicTemplate = {
	id: "matchday-editorial-gold",
	name: "Editorial matchday",
	description: "Square black and gold fixture announcement with optional sponsors.",
	width: 1365,
	height: 1365,
	resolveHeight: (content) => content.fields.showSponsors === false
		? MATCHDAY_SPONSOR_FREE_HEIGHT
		: 1365,
	supportedKinds: ["fixture"],
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
	render: renderMatchdayEditorialTemplate,
};

async function renderMatchdayEditorialTemplate({
	context,
	width,
	height,
	content,
}: SocialGraphicTemplateRenderContext) {
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

	drawEditorialSectionTitle(context, fixture.competition || "Fixture", 72, width, 560);
	drawFittedText(context, content.headline.toUpperCase(), width / 2, 112, 1230, 210, 88, EDITORIAL_WHITE, "center");

	const homeTeam = fixture.venue === "home" ? fixture.teamName : fixture.opponent;
	const awayTeam = fixture.venue === "away" ? fixture.teamName : fixture.opponent;

	await Promise.all([
		drawTeam(context, content.assets.homeTeamLogo, homeTeam, "HOME", 190, 425),
		drawTeam(context, content.assets.awayTeamLogo, awayTeam, "AWAY", 888, 425),
	]);

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

	const detailTop = 895;
	drawRoundedFrame(context, 64, detailTop, 1237, MATCHDAY_DETAIL_HEIGHT, 20);
	drawMatchDetails(context, fixture.date, fixture.location, detailTop, MATCHDAY_DETAIL_HEIGHT);

	if (showSponsors) {
		drawEditorialSectionTitle(
			context,
			getTextField(content.fields.sponsorsTitle, "Proudly sponsored by"),
			MATCHDAY_SPONSOR_TOP,
			width,
			530
		);
		await Promise.all([
			drawAssetOrPlaceholder(context, content.assets.sponsors[0], 64, MATCHDAY_SPONSOR_TOP + 48, 390, 160, "SPONSOR\nPLACEHOLDER", { contain: true }),
			drawAssetOrPlaceholder(context, content.assets.sponsors[1], 487, MATCHDAY_SPONSOR_TOP + 48, 390, 160, "SPONSOR\nPLACEHOLDER", { contain: true }),
			drawAssetOrPlaceholder(context, content.assets.sponsors[2], 910, MATCHDAY_SPONSOR_TOP + 48, 390, 160, "SPONSOR\nPLACEHOLDER", { contain: true }),
		]);
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
