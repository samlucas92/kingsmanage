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
import {
	parseEditableTemplateLayout,
	serializeEditableTemplateLayout,
	withElementTransform,
	withElementTransformAsync,
} from "./editableTemplateLayout";
import type { EditableTemplateLayout } from "./editableTemplateLayout";

const LINEUP_SPONSOR_TOP = 1400;
const LINEUP_SPONSOR_FREE_HEIGHT = 1400;
const PITCH = { x: 78, y: 400, width: 1209, height: 730 };

export type LineupEditorialElementId =
	| "section-heading"
	| "headline"
	| "club-crest"
	| "match-label"
	| "pitch"
	| "substitutes"
	| "sponsor-section";

export type LineupEditorialTemplateDefinition = EditableTemplateLayout<LineupEditorialElementId>;

export const lineupEditorialDefaultDefinition: LineupEditorialTemplateDefinition = {
	version: 1,
	canvas: { width: 1365, height: 1651, sponsorFreeHeight: LINEUP_SPONSOR_FREE_HEIGHT },
	elements: {
		"section-heading": { x: 397, y: 54, width: 570, height: 68 },
		headline: { x: 62, y: 126, width: 970, height: 194 },
		"club-crest": { x: 1034, y: 50, width: 250, height: 300 },
		"match-label": { x: 102, y: 337, width: 1160, height: 42 },
		pitch: { ...PITCH },
		substitutes: { x: 78, y: 1158, width: 1209, height: 162 },
		"sponsor-section": { x: 64, y: LINEUP_SPONSOR_TOP - 34, width: 1236, height: 270 },
	},
};

export const lineupEditorialDefaultSource = serializeEditableTemplateLayout(
	lineupEditorialDefaultDefinition
);

export const lineupEditorialTemplate = createLineupEditorialTemplate();

export function createLineupEditorialTemplate(
	definition = lineupEditorialDefaultDefinition
): SocialGraphicTemplate {
	return {
	id: "lineup-editorial-gold",
	name: "Editorial match lineup",
	description: "Black and gold formation graphic generated from a match lineup.",
	width: definition.canvas.width,
	height: definition.canvas.height,
	resolveHeight: (content) => content.fields.showSponsors === false
		? definition.canvas.sponsorFreeHeight
		: definition.canvas.height,
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
	render: (context) => renderLineupEditorialTemplate(context, definition),
	};
}

export function parseLineupEditorialDefinition(source: string) {
	return parseEditableTemplateLayout(source, lineupEditorialDefaultDefinition);
}

export const serializeLineupEditorialDefinition = serializeEditableTemplateLayout;

async function renderLineupEditorialTemplate({
	context,
	width,
	height,
	content,
}: SocialGraphicTemplateRenderContext, definition: LineupEditorialTemplateDefinition) {
	const fixture = content.fixtures[0];
	const lineup = content.lineup;
	const showSponsors = content.fields.showSponsors !== false;

	context.save();
	drawEditorialBackground(context, width, height);
	drawEditorialBorder(context, width, height);

	withElementTransform(context, lineupEditorialDefaultDefinition.elements["section-heading"], definition.elements["section-heading"], () => {
		drawEditorialSectionTitle(context, fixture?.competition || "Match lineup", 88, width, 570);
	});
	withElementTransform(context, lineupEditorialDefaultDefinition.elements.headline, definition.elements.headline, () => {
		drawFittedText(context, content.headline.toUpperCase(), 62, 126, 970, 194, 78, EDITORIAL_WHITE);
	});
	await withElementTransformAsync(context, lineupEditorialDefaultDefinition.elements["club-crest"], definition.elements["club-crest"], () => drawAssetOrPlaceholder(
		context, content.assets.homeTeamLogo, 1034, 50, 250, 300, "YOUR\nLOGO", { frame: false, contain: true }
	));

	if (!fixture) {
		drawMultilineText(context, "SELECT AN UPCOMING\nMATCH", width / 2, height / 2, 54, EDITORIAL_WHITE);
		context.restore();
		return;
	}

	withElementTransform(context, lineupEditorialDefaultDefinition.elements["match-label"], definition.elements["match-label"], () => {
		drawFittedText(context, `${fixture.teamName} · ${fixture.venue === "home" ? "VS" : "AT"} ${fixture.opponent}`.toUpperCase(), width / 2, 337, 1160, 42, 24, EDITORIAL_GOLD, "center");
	});

	withElementTransform(context, lineupEditorialDefaultDefinition.elements.pitch, definition.elements.pitch, () => {
		drawPitch(context);
		const starters = lineup?.players.filter((player) => player.role === "starter") ?? [];
		if (starters.length === 0) {
			drawMultilineText(context, "NO STARTING LINEUP\nSELECTED", width / 2, PITCH.y + PITCH.height / 2, 42, EDITORIAL_WHITE);
		} else {
			const layout = getStarterLayout(starters);
			starters.forEach((player, index) => drawStarter(context, player, layout[index]));
		}
	});

	const substitutes = lineup?.players.filter((player) => player.role === "substitute") ?? [];
	withElementTransform(context, lineupEditorialDefaultDefinition.elements.substitutes, definition.elements.substitutes, () => {
		drawBench(context, substitutes, lineup?.formationName || "Formation TBC");
	});

	if (showSponsors) {
		await withElementTransformAsync(context, lineupEditorialDefaultDefinition.elements["sponsor-section"], definition.elements["sponsor-section"], async () => {
			drawEditorialSectionTitle(context, getTextField(content.fields.sponsorsTitle, "Proudly sponsored by"), LINEUP_SPONSOR_TOP, width, 530);
			await Promise.all([
				drawAssetOrPlaceholder(context, content.assets.sponsors[0], 64, LINEUP_SPONSOR_TOP + 55, 390, 155, "SPONSOR\nPLACEHOLDER", { contain: true }),
				drawAssetOrPlaceholder(context, content.assets.sponsors[1], 487, LINEUP_SPONSOR_TOP + 55, 390, 155, "SPONSOR\nPLACEHOLDER", { contain: true }),
				drawAssetOrPlaceholder(context, content.assets.sponsors[2], 910, LINEUP_SPONSOR_TOP + 55, 390, 155, "SPONSOR\nPLACEHOLDER", { contain: true }),
			]);
		});
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
	layout: { x: number; y: number }
) {
	const x = PITCH.x + 120 + layout.x * (PITCH.width - 240);
	const y = PITCH.y + 45 + layout.y * (PITCH.height - 135);

	context.beginPath();
	context.arc(x, y, 33, 0, Math.PI * 2);
	context.fillStyle = EDITORIAL_GOLD;
	context.fill();
	context.lineWidth = 3;
	context.strokeStyle = EDITORIAL_WHITE;
	context.stroke();
	drawFittedText(
		context,
		player.number === undefined ? "–" : String(player.number),
		x,
		y - 22,
		50,
		40,
		24,
		"#050606",
		"center"
	);

	context.fillStyle = "rgba(5,6,6,.9)";
	context.fillRect(x - 110, y + 39, 220, 46);
	const label = player.position.trim()
		? `${player.name} · ${player.position}`
		: player.name;
	const captainBadgeWidth = player.isCaptain ? 28 : 0;
	drawFittedText(
		context,
		label.toUpperCase(),
		x - captainBadgeWidth / 2,
		y + 47,
		204 - captainBadgeWidth - (player.isCaptain ? 6 : 0),
		28,
		14,
		EDITORIAL_WHITE,
		"center"
	);
	if (player.isCaptain) {
		context.fillStyle = EDITORIAL_GOLD;
		context.fillRect(x + 74, y + 46, captainBadgeWidth, 30);
		drawFittedText(context, "C", x + 88, y + 49, 20, 22, 18, "#050606", "center");
	}
}

function getStarterLayout(players: SocialLineupPlayer[]) {
	const fallbackColumns = Math.min(4, Math.max(1, players.length));
	const rawPositions = players.map((player, index) => ({
		x: player.x ?? ((index % fallbackColumns) + 1) * 100 / (fallbackColumns + 1),
		y: player.y ?? (20 + Math.floor(index / fallbackColumns) * 22),
	}));
	const xValues = rawPositions.map((position) => position.x);
	const yValues = rawPositions.map((position) => position.y);
	const minX = Math.min(...xValues);
	const maxX = Math.max(...xValues);
	const minY = Math.min(...yValues);
	const maxY = Math.max(...yValues);
	const xRange = maxX - minX;
	const yRange = maxY - minY;

	return rawPositions.map((position) => ({
		x: xRange > 0 ? (position.x - minX) / xRange : 0.5,
		y: yRange > 0 ? (position.y - minY) / yRange : 0.5,
	}));
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
	const cellWidth = Math.min(300, 1145 / columnCount);
	players.forEach((player, index) => {
		const row = Math.floor(index / columnCount);
		const column = index % columnCount;
		const rowWidth = Math.min(columnCount, players.length - row * columnCount);
		const totalRowWidth = rowWidth * cellWidth;
		const x = 682.5 - totalRowWidth / 2 + column * cellWidth + cellWidth / 2;
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
