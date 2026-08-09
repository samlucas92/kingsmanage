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

const LINEUP_SPONSOR_TOP = 1370;
const LINEUP_SPONSOR_FREE_HEIGHT = 1370;
const PITCH = { x: 78, y: 405, width: 1209, height: 750 };

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
			drawAssetOrPlaceholder(context, content.assets.sponsors[0], 64, LINEUP_SPONSOR_TOP + 48, 390, 205, "SPONSOR\nPLACEHOLDER", { contain: true }),
			drawAssetOrPlaceholder(context, content.assets.sponsors[1], 487, LINEUP_SPONSOR_TOP + 48, 390, 205, "SPONSOR\nPLACEHOLDER", { contain: true }),
			drawAssetOrPlaceholder(context, content.assets.sponsors[2], 910, LINEUP_SPONSOR_TOP + 48, 390, 205, "SPONSOR\nPLACEHOLDER", { contain: true }),
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
	context.arc(x, y, 36, 0, Math.PI * 2);
	context.fillStyle = EDITORIAL_GOLD;
	context.fill();
	context.lineWidth = 4;
	context.strokeStyle = EDITORIAL_WHITE;
	context.stroke();
	drawFittedText(
		context,
		player.number === undefined ? "–" : String(player.number),
		x,
		y - 24,
		52,
		42,
		25,
		"#050606",
		"center"
	);

	context.fillStyle = "rgba(5,6,6,.88)";
	context.fillRect(x - 96, y + 43, 192, 55);
	drawFittedText(context, player.name.toUpperCase(), x, y + 49, 178, 26, 15, EDITORIAL_WHITE, "center");
	if (player.position.trim()) {
		drawFittedText(context, player.position.toUpperCase(), x, y + 102, 118, 18, 12, EDITORIAL_GOLD, "center");
	}
}

function drawBench(
	context: CanvasRenderingContext2D,
	players: SocialLineupPlayer[],
	formationName: string
) {
	drawFittedText(context, `FORMATION · ${formationName}`.toUpperCase(), 78, 1185, 420, 30, 18, EDITORIAL_GOLD);
	drawFittedText(context, "SUBSTITUTES", 1287, 1185, 330, 34, 22, EDITORIAL_GOLD, "right");
	drawRoundedFrame(context, 78, 1230, 1209, 94, 18);

	const label = players.length > 0
		? players.map((player) => `${player.number ?? "–"}  ${player.name}`).join("   ·   ")
		: "No substitutes selected";
	drawFittedText(context, label.toUpperCase(), 682.5, 1257, 1145, 30, 14, EDITORIAL_WHITE, "center");
}
