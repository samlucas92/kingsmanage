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

export const matchdayEditorialTemplate: SocialGraphicTemplate = {
	id: "matchday-editorial-gold",
	name: "Editorial matchday",
	description: "Square black and gold fixture announcement with optional sponsors.",
	width: 1365,
	height: 1365,
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
	context.translate(width / 2, 570);
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

	const detailTop = 874;
	const detailHeight = showSponsors ? 190 : 398;
	drawRoundedFrame(context, 64, detailTop, 1237, detailHeight, 20);
	drawMatchDetails(context, fixture.date, fixture.location, detailTop, detailHeight);

	if (showSponsors) {
		const sponsorTop = 1122;
		drawEditorialSectionTitle(
			context,
			getTextField(content.fields.sponsorsTitle, "Proudly sponsored by"),
			sponsorTop,
			width,
			530
		);
		await Promise.all([
			drawAssetOrPlaceholder(context, content.assets.sponsors[0], 64, sponsorTop + 36, 390, 172, "SPONSOR\nPLACEHOLDER", { contain: true }),
			drawAssetOrPlaceholder(context, content.assets.sponsors[1], 487, sponsorTop + 36, 390, 172, "SPONSOR\nPLACEHOLDER", { contain: true }),
			drawAssetOrPlaceholder(context, content.assets.sponsors[2], 910, sponsorTop + 36, 390, 172, "SPONSOR\nPLACEHOLDER", { contain: true }),
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
		await drawAssetOrPlaceholder(context, asset, x, y, 290, 300, "", { frame: false, contain: true });
	} else {
		drawShieldPlaceholder(context, x + 20, y, 250, 300);
	}
	drawFittedText(context, teamName.toUpperCase(), x + 145, y + 330, 420, 50, 26, EDITORIAL_WHITE, "center");
	drawFittedText(context, `(${venueLabel})`, x + 145, y + 390, 260, 30, 20, EDITORIAL_GOLD, "center");
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
	const centreY = y + height * 0.34;

	drawCalendarIcon(context, 238, centreY - 35, 70);
	drawClockIcon(context, 682, centreY + 2, 74);
	drawLocationIcon(context, 1100, centreY - 14, 50);

	drawFittedText(context, dateLabel, 273, y + height * 0.56, 280, 37, 21, EDITORIAL_WHITE, "center");
	drawFittedText(context, timeLabel, 682, y + height * 0.56, 250, 37, 21, EDITORIAL_WHITE, "center");
	drawWrappedText(context, location.toUpperCase(), 1090, y + height * 0.54, 330, 2, 32, 17, EDITORIAL_WHITE, "center");

	context.strokeStyle = EDITORIAL_GOLD;
	context.lineWidth = 3;
	context.beginPath();
	context.moveTo(470, y + 28);
	context.lineTo(470, y + height - 28);
	context.moveTo(890, y + 28);
	context.lineTo(890, y + height - 28);
	context.stroke();
}
