import type {
	SocialGraphicTemplate,
	SocialGraphicTemplateRenderContext,
	SocialLineupPlayer,
} from "../types";
import {
	drawAssetOrPlaceholder,
	drawEditorialBackground,
	drawEditorialBorder,
	drawEditorialSectionTitle,
	drawFittedText,
	drawMultilineText,
	drawRoundedFrame,
	EDITORIAL_GOLD,
	EDITORIAL_WHITE,
	getTextField,
} from "./editorialCanvas";

const LINEUP_SPONSOR_TOP = 1400;
const LINEUP_SPONSOR_FREE_HEIGHT = 1400;
const PITCH = { x: 78, y: 400, width: 1209, height: 730 };

export const lineupEditorialTemplate: SocialGraphicTemplate = {
	id: "lineup-editorial-gold",
	name: "Editorial match lineup",
	description: "Black and gold formation graphic generated from a match lineup.",
	width: 1365,
	height: 1651,
	resolveHeight: (content) => content.fields.showSponsors === false
		? LINEUP_SPONSOR_FREE_HEIGHT
		: 1651,
	supportedKinds: ["lineup"],
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
	render: renderLineupEditorialTemplate,
};

async function renderLineupEditorialTemplate({
	context,
	width,
	height,
	content,
}: SocialGraphicTemplateRenderContext) {
	const fixture = content.fixtures[0];
	const lineup = content.lineup;
	const showSponsors = content.fields.showSponsors !== false;

	context.save();
	drawEditorialBackground(context, width, height);
	drawEditorialBorder(context, width, height);

	drawEditorialSectionTitle(
		context,
		fixture?.competition || "Match lineup",
		88,
		width,
		570
	);
	drawFittedText(
		context,
		content.headline.toUpperCase(),
		62,
		126,
		970,
		194,
		78,
		EDITORIAL_WHITE
	);
	await drawAssetOrPlaceholder(
		context,
		content.assets.homeTeamLogo,
		1034,
		50,
		250,
		300,
		"YOUR\nLOGO",
		{ frame: false, contain: true }
	);

	if (!fixture) {
		drawMultilineText(context, "SELECT AN UPCOMING\nMATCH", width / 2, height / 2, 54, EDITORIAL_WHITE);
		context.restore();
		return;
	}

	drawFittedText(
		context,
		`${fixture.teamName} · ${fixture.venue === "home" ? "VS" : "AT"} ${fixture.opponent}`.toUpperCase(),
		width / 2,
		337,
		1160,
		42,
		24,
		EDITORIAL_GOLD,
		"center"
	);

	drawPitch(context);
	const starters = lineup?.players.filter((player) => player.role === "starter") ?? [];
	if (starters.length === 0) {
		drawMultilineText(context, "NO STARTING LINEUP\nSELECTED", width / 2, PITCH.y + PITCH.height / 2, 42, EDITORIAL_WHITE);
	} else {
		starters.forEach((player, index) => drawStarter(context, player, index, starters.length));
	}

	const substitutes = lineup?.players.filter((player) => player.role === "substitute") ?? [];
	drawBench(context, substitutes, lineup?.formationName || "Formation TBC");

	if (showSponsors) {
		drawEditorialSectionTitle(
			context,
			getTextField(content.fields.sponsorsTitle, "Proudly sponsored by"),
			LINEUP_SPONSOR_TOP,
			width,
			530
		);
		await Promise.all([
			drawAssetOrPlaceholder(context, content.assets.sponsors[0], 64, LINEUP_SPONSOR_TOP + 55, 390, 155, "SPONSOR\nPLACEHOLDER", { contain: true }),
			drawAssetOrPlaceholder(context, content.assets.sponsors[1], 487, LINEUP_SPONSOR_TOP + 55, 390, 155, "SPONSOR\nPLACEHOLDER", { contain: true }),
			drawAssetOrPlaceholder(context, content.assets.sponsors[2], 910, LINEUP_SPONSOR_TOP + 55, 390, 155, "SPONSOR\nPLACEHOLDER", { contain: true }),
		]);
	}

	context.restore();
}

function drawPitch(context: CanvasRenderingContext2D) {
	context.fillStyle = "rgba(8,38,25,.9)";
	context.fillRect(PITCH.x, PITCH.y, PITCH.width, PITCH.height);

	for (let band = 0; band < 8; band += 1) {
		if (band % 2 === 0) {
			context.fillStyle = "rgba(255,255,255,.025)";
			context.fillRect(
				PITCH.x + band * PITCH.width / 8,
				PITCH.y,
				PITCH.width / 8,
				PITCH.height
			);
		}
	}

	context.save();
	context.strokeStyle = "rgba(215,166,0,.62)";
	context.lineWidth = 3;
	context.strokeRect(PITCH.x + 18, PITCH.y + 18, PITCH.width - 36, PITCH.height - 36);
	context.beginPath();
	context.moveTo(PITCH.x + 18, PITCH.y + PITCH.height / 2);
	context.lineTo(PITCH.x + PITCH.width - 18, PITCH.y + PITCH.height / 2);
	context.stroke();
	context.beginPath();
	context.arc(PITCH.x + PITCH.width / 2, PITCH.y + PITCH.height / 2, 92, 0, Math.PI * 2);
	context.stroke();
	context.strokeRect(PITCH.x + PITCH.width * 0.32, PITCH.y + 18, PITCH.width * 0.36, 115);
	context.strokeRect(PITCH.x + PITCH.width * 0.32, PITCH.y + PITCH.height - 133, PITCH.width * 0.36, 115);
	context.restore();

	drawRoundedFrame(context, PITCH.x, PITCH.y, PITCH.width, PITCH.height, 24);
}

function drawStarter(
	context: CanvasRenderingContext2D,
	player: SocialLineupPlayer,
	index: number,
	total: number
) {
	const fallbackColumns = Math.min(4, Math.max(1, total));
	const fallbackRow = Math.floor(index / fallbackColumns);
	const fallbackColumn = index % fallbackColumns;
	const xRatio = player.x ?? ((fallbackColumn + 1) * 100 / (fallbackColumns + 1));
	const yRatio = player.y ?? (22 + fallbackRow * 20);
	const x = PITCH.x + 70 + Math.min(100, Math.max(0, xRatio)) / 100 * (PITCH.width - 140);
	const y = PITCH.y + 62 + Math.min(100, Math.max(0, yRatio)) / 100 * (PITCH.height - 124);

	context.beginPath();
	context.arc(x, y, 28, 0, Math.PI * 2);
	context.fillStyle = EDITORIAL_GOLD;
	context.fill();
	context.lineWidth = 3;
	context.strokeStyle = EDITORIAL_WHITE;
	context.stroke();
	drawFittedText(
		context,
		player.number === undefined ? "–" : String(player.number),
		x,
		y - 19,
		44,
		34,
		22,
		"#050606",
		"center"
	);

	context.fillStyle = "rgba(5,6,6,.9)";
	context.fillRect(x - 82, y + 33, 164, 37);
	const label = player.position.trim()
		? `${player.name} · ${player.position}`
		: player.name;
	drawFittedText(context, label.toUpperCase(), x, y + 40, 150, 20, 11, EDITORIAL_WHITE, "center");
}

function drawBench(
	context: CanvasRenderingContext2D,
	players: SocialLineupPlayer[],
	formationName: string
) {
	drawFittedText(context, `FORMATION · ${formationName}`.toUpperCase(), 78, 1158, 420, 30, 18, EDITORIAL_GOLD);
	drawFittedText(context, "SUBSTITUTES", 1287, 1158, 330, 34, 22, EDITORIAL_GOLD, "right");
	drawRoundedFrame(context, 78, 1200, 1209, 120, 18);

	if (players.length === 0) {
		drawFittedText(context, "NO SUBSTITUTES SELECTED", 682.5, 1243, 520, 28, 17, EDITORIAL_WHITE, "center");
		return;
	}

	const columnCount = Math.min(4, players.length);
	const rowCount = Math.ceil(players.length / columnCount);
	const cellWidth = 1145 / columnCount;
	players.forEach((player, index) => {
		const row = Math.floor(index / columnCount);
		const column = index % columnCount;
		const rowWidth = Math.min(columnCount, players.length - row * columnCount);
		const rowOffset = (columnCount - rowWidth) * cellWidth / 2;
		const x = 110 + rowOffset + column * cellWidth + cellWidth / 2;
		const y = rowCount === 1 ? 1243 : 1218 + row * 51;
		drawFittedText(
			context,
			`${player.number ?? "–"}  ${player.name}`.toUpperCase(),
			x,
			y,
			cellWidth - 24,
			24,
			13,
			EDITORIAL_WHITE,
			"center"
		);
	});
}
