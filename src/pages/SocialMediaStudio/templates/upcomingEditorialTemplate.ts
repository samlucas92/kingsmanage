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
	EDITORIAL_GOLD,
	EDITORIAL_WHITE,
	getTextField,
} from "./editorialCanvas";

export const upcomingEditorialTemplate: SocialGraphicTemplate = {
	id: "upcoming-editorial-gold",
	name: "Editorial fixtures",
	description: "Black and gold roundup for up to five upcoming fixtures.",
	width: 1365,
	height: 1651,
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
	render: renderUpcomingEditorialTemplate,
};

async function renderUpcomingEditorialTemplate({
	context,
	width,
	height,
	content,
}: SocialGraphicTemplateRenderContext) {
	const showSponsors = content.fields.showSponsors !== false;
	const fixtures = content.fixtures.slice(0, 5);

	context.save();
	drawEditorialBackground(context, width, height);
	drawEditorialBorder(context, width, height);
	drawEditorialSectionTitle(context, "Upcoming", 88, width, 430);
	drawFittedText(context, content.headline.toUpperCase(), 66, 126, 970, 212, 82, EDITORIAL_WHITE);
	await drawAssetOrPlaceholder(
		context,
		content.assets.homeTeamLogo,
		1085,
		110,
		190,
		210,
		"YOUR\nLOGO\nHERE",
		{ frame: false, contain: true }
	);

	if (fixtures.length === 0) {
		drawMultilineText(context, "SELECT UPCOMING\nFIXTURES", width / 2, height / 2, 54, EDITORIAL_WHITE);
		context.restore();
		return;
	}

	const listTop = 432;
	const listBottom = showSponsors ? 1268 : height - 66;
	const gap = 16;
	const maximumRowHeight = showSponsors ? 155 : 215;
	const rowHeight = Math.min(
		maximumRowHeight,
		(listBottom - listTop - gap * (fixtures.length - 1)) / fixtures.length
	);

	for (let index = 0; index < fixtures.length; index += 1) {
		await drawFixtureRow(
			context,
			fixtures[index],
			content.assets.fixtureLogos[index],
			listTop + index * (rowHeight + gap),
			rowHeight
		);
	}

	if (showSponsors) {
		const sponsorTop = 1330;
		drawEditorialSectionTitle(
			context,
			getTextField(content.fields.sponsorsTitle, "Proudly sponsored by"),
			sponsorTop,
			width,
			520
		);
		await Promise.all([
			drawAssetOrPlaceholder(context, content.assets.sponsors[0], 62, sponsorTop + 42, 390, 218, "SPONSOR\nPLACEHOLDER", { contain: true }),
			drawAssetOrPlaceholder(context, content.assets.sponsors[1], 487, sponsorTop + 42, 390, 218, "SPONSOR\nPLACEHOLDER", { contain: true }),
			drawAssetOrPlaceholder(context, content.assets.sponsors[2], 912, sponsorTop + 42, 390, 218, "SPONSOR\nPLACEHOLDER", { contain: true }),
		]);
	}

	context.restore();
}

async function drawFixtureRow(
	context: CanvasRenderingContext2D,
	fixture: SocialFixture,
	opponentLogo: SocialGraphicTemplateRenderContext["content"]["assets"]["fixtureLogos"][number],
	y: number,
	height: number
) {
	drawRoundedFrame(context, 62, y, 1240, height, 18);
	drawCalendarIcon(context, 102, y + height * 0.28, 68);

	const date = new Date(fixture.date);
	const dateText = Number.isNaN(date.getTime())
		? "DATE TBC"
		: date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }).toUpperCase();
	drawFittedText(context, dateText, 205, y + height * 0.27, 210, 34, 20, EDITORIAL_WHITE);
	drawFittedText(context, fixture.competition.toUpperCase(), 205, y + height * 0.58, 210, 27, 17, EDITORIAL_GOLD);
	drawVerticalDivider(context, 410, y + 24, height - 48);

	if (opponentLogo) {
		await drawAssetOrPlaceholder(context, opponentLogo, 462, y + 24, 104, height - 48, "", { frame: false, contain: true });
	} else {
		drawShieldPlaceholder(context, 476, y + 28, 78, height - 56);
	}
	drawFittedText(context, "VS", 598, y + height * 0.35, 52, 38, 24, EDITORIAL_GOLD, "center");
	drawFittedText(context, fixture.opponent.toUpperCase(), 660, y + height * 0.29, 290, 38, 20, EDITORIAL_WHITE);
	drawVerticalDivider(context, 978, y + 24, height - 48);

	drawLocationIcon(context, 1032, y + height * 0.37, 62);
	drawFittedText(context, fixture.venue.toUpperCase(), 1080, y + height * 0.3, 165, 30, 20, EDITORIAL_GOLD);
	drawFittedText(context, fixture.location.toUpperCase(), 1080, y + height * 0.58, 175, 22, 14, EDITORIAL_WHITE);
}

function drawVerticalDivider(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	height: number
) {
	context.strokeStyle = EDITORIAL_GOLD;
	context.lineWidth = 3;
	context.beginPath();
	context.moveTo(x, y);
	context.lineTo(x, y + height);
	context.stroke();
}

