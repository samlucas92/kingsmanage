import { loadTemplateImage } from "../socialGraphicCanvas";
import {
	drawEditorialBackground,
	drawImageContain as drawContainedImage,
} from "./editorialCanvas";
import type {
	SocialGraphicAsset,
	SocialScorer,
	SocialGraphicTemplate,
	SocialGraphicTemplateRenderContext,
} from "../types";
import {
	parseEditableTemplateLayout,
	serializeEditableTemplateLayout,
	withElementTransform,
	withElementTransformAsync,
} from "./editableTemplateLayout";
import type { EditableTemplateLayout } from "./editableTemplateLayout";

const GOLD = "#d7a600";
const WHITE = "#f4f4f2";
const RESULT_CONTENT_BOTTOM = 1242;
const RESULT_SPONSOR_TOP = 1302;

export type ResultEditorialElementId =
	| "section-heading"
	| "headline"
	| "club-crest"
	| "score-panel"
	| "featured-area"
	| "sponsor-section";

export type ResultEditorialTemplateDefinition = EditableTemplateLayout<ResultEditorialElementId>;

export const resultEditorialDefaultDefinition: ResultEditorialTemplateDefinition = {
	version: 1,
	canvas: { width: 1365, height: 1651, sponsorFreeHeight: RESULT_SPONSOR_TOP },
	elements: {
		"section-heading": { x: 108, y: 46, width: 950, height: 72 },
		headline: { x: 62, y: 150, width: 940, height: 204 },
		"club-crest": { x: 1005, y: 55, width: 280, height: 340 },
		"score-panel": { x: 66, y: 448, width: 744, height: 794 },
		"featured-area": { x: 864, y: 448, width: 430, height: 794 },
		"sponsor-section": { x: 52, y: RESULT_SPONSOR_TOP - 34, width: 1265, height: 315 },
	},
};

export const resultEditorialDefaultSource = serializeEditableTemplateLayout(
	resultEditorialDefaultDefinition
);

export const resultEditorialTemplate = createResultEditorialTemplate();

export function createResultEditorialTemplate(
	definition = resultEditorialDefaultDefinition
): SocialGraphicTemplate {
	return {
	id: "result-editorial-gold",
	name: "Editorial result",
	description: "Black and gold result layout with optional featured and sponsor imagery.",
	width: definition.canvas.width,
	height: definition.canvas.height,
	resolveHeight: (content) => content.fields.showSponsors === false
		? definition.canvas.sponsorFreeHeight
		: definition.canvas.height,
	supportedKinds: ["result"],
	fields: [
		{
			id: "featuredTitle",
			label: "Featured area title",
			type: "text",
			defaultValue: "Player of the match",
		},
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
	render: (context) => renderResultEditorialTemplate(context, definition),
	};
}

export function parseResultEditorialDefinition(source: string) {
	return parseEditableTemplateLayout(source, resultEditorialDefaultDefinition);
}

export const serializeResultEditorialDefinition = serializeEditableTemplateLayout;

async function renderResultEditorialTemplate({
	context,
	width,
	height,
	content,
}: SocialGraphicTemplateRenderContext, definition: ResultEditorialTemplateDefinition) {
	const fixture = content.fixtures[0];
	const showSponsors = content.fields.showSponsors !== false;

	context.save();
	drawEditorialBackground(context, width, height);
	drawBorder(context, width, height);

	if (!fixture?.result) {
		drawCentredText(context, "SELECT A COMPLETED RESULT", width / 2, height / 2, 54, WHITE);
		context.restore();
		return;
	}
	const result = fixture.result;

	const homeTeam = fixture.venue === "home" ? fixture.teamName : fixture.opponent;
	const awayTeam = fixture.venue === "away" ? fixture.teamName : fixture.opponent;
	const clubLogo = fixture.venue === "home"
		? content.assets.homeTeamLogo
		: content.assets.awayTeamLogo;
	const competition = fixture.competition || "Competition";

	withElementTransform(context, resultEditorialDefaultDefinition.elements["section-heading"], definition.elements["section-heading"], () => {
		drawSectionTitle(context, competition, 108, 90, 950);
	});
	withElementTransform(context, resultEditorialDefaultDefinition.elements.headline, definition.elements.headline, () => {
		drawFittedText(context, content.headline.toUpperCase(), 62, 150, 940, 204, 198, 82, WHITE, "left");
	});

	await withElementTransformAsync(context, resultEditorialDefaultDefinition.elements["club-crest"], definition.elements["club-crest"], () => drawAssetOrPlaceholder(
		context, clubLogo, 1005, 55, 280, 340, "YOUR TEAM\nLOGO", false, true
	));

	await withElementTransformAsync(context, resultEditorialDefaultDefinition.elements["score-panel"], definition.elements["score-panel"], async () => {
		context.strokeStyle = GOLD;
		context.lineWidth = 5;
		context.beginPath();
		context.moveTo(810, 448);
		context.lineTo(810, RESULT_CONTENT_BOTTOM);
		context.stroke();
		await drawTeamRow({ context, y: 505, teamName: homeTeam, score: result.homeGoals, asset: content.assets.homeTeamLogo, label: "HOME TEAM\nLOGO", scorers: fixture.venue === "home" ? fixture.scorers : [] });
		context.strokeStyle = GOLD;
		context.lineWidth = 3;
		context.beginPath();
		context.moveTo(66, 866);
		context.lineTo(756, 866);
		context.stroke();
		await drawTeamRow({ context, y: 942, teamName: awayTeam, score: result.awayGoals, asset: content.assets.awayTeamLogo, label: "AWAY TEAM\nLOGO", scorers: fixture.venue === "away" ? fixture.scorers : [] });
	});

	await withElementTransformAsync(context, resultEditorialDefaultDefinition.elements["featured-area"], definition.elements["featured-area"], async () => {
		const featuredTitle = getTextField(content.fields.featuredTitle, "Player of the match");
		drawFittedText(context, featuredTitle.toUpperCase(), 1079, 474, 390, 58, 46, 24, GOLD, "center");
		await drawAssetOrPlaceholder(context, content.assets.featuredImage, 864, 554, 430, RESULT_CONTENT_BOTTOM - 574, "PLAYER IMAGE", true, false);
		if (fixture.playerOfTheMatch.trim()) {
			const captionTop = RESULT_CONTENT_BOTTOM - 118;
			context.fillStyle = "rgba(0,0,0,.82)";
			context.fillRect(868, captionTop, 422, 94);
			drawFittedText(context, fixture.playerOfTheMatch.toUpperCase(), 1079, captionTop + 23, 378, 48, 42, 22, WHITE, "center");
		}
	});

	if (showSponsors) {
		const sponsorsTitle = getTextField(content.fields.sponsorsTitle, "Proudly sponsored by");
		await withElementTransformAsync(context, resultEditorialDefaultDefinition.elements["sponsor-section"], definition.elements["sponsor-section"], async () => {
			drawDividerTitle(context, sponsorsTitle.toUpperCase(), RESULT_SPONSOR_TOP);
			await Promise.all([
				drawSponsorSlot(context, content.assets.sponsors[0], 52, RESULT_SPONSOR_TOP + 72),
				drawSponsorSlot(context, content.assets.sponsors[1], 487, RESULT_SPONSOR_TOP + 72),
				drawSponsorSlot(context, content.assets.sponsors[2], 922, RESULT_SPONSOR_TOP + 72),
			]);
		});
	}

	context.restore();
}

function drawBorder(context: CanvasRenderingContext2D, width: number, height: number) {
	context.strokeStyle = GOLD;
	context.lineWidth = 3;
	context.strokeRect(20, 20, width - 40, height - 40);
}

function drawSectionTitle(
	context: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	areaWidth: number
) {
	drawFittedText(context, text.toUpperCase(), x + areaWidth / 2, y - 22, areaWidth * 0.48, 62, 55, 28, GOLD, "center");
	context.strokeStyle = GOLD;
	context.lineWidth = 3;
	context.beginPath();
	context.moveTo(x, y);
	context.lineTo(x + areaWidth * 0.21, y);
	context.moveTo(x + areaWidth * 0.79, y);
	context.lineTo(x + areaWidth, y);
	context.stroke();
}

async function drawTeamRow({
	context,
	y,
	teamName,
	score,
	asset,
	label,
	scorers,
}: {
	context: CanvasRenderingContext2D;
	y: number;
	teamName: string;
	score: number;
	asset?: SocialGraphicAsset;
	label: string;
	scorers: SocialScorer[];
}) {
	await drawAssetOrPlaceholder(context, asset, 70, y, 235, 276, label, true, true);
	drawFittedText(context, teamName.toUpperCase(), 340, y + 104, 310, 92, 62, 30, WHITE, "left");
	drawScorerList(context, scorers, 340, y + 176, 310);
	drawFittedText(context, String(score), 720, y + 34, 94, 210, 202, 82, WHITE, "center");
}

function drawScorerList(
	context: CanvasRenderingContext2D,
	scorers: SocialScorer[],
	x: number,
	y: number,
	width: number
) {
	if (scorers.length === 0) return;

	drawFittedText(context, "SCORERS", x, y, width, 28, 22, 15, GOLD, "left");
	const labels = scorers.map((scorer) => (
		`${scorer.name.toUpperCase()}${scorer.goals > 1 ? ` ×${scorer.goals}` : ""}`
	));
	let fontSize = 20;
	let lines = wrapScorerLabels(context, labels, width, fontSize);
	while (lines.length > 3 && fontSize > 12) {
		fontSize -= 1;
		lines = wrapScorerLabels(context, labels, width, fontSize);
	}

	if (lines.length > 3) {
		lines = [lines[0], lines[1], lines.slice(2).join(" · ")];
	}

	context.fillStyle = WHITE;
	context.font = `700 ${fontSize}px "Arial Narrow", sans-serif`;
	context.textAlign = "left";
	context.textBaseline = "top";
	lines.forEach((line, index) => {
		context.fillText(line, x, y + 34 + index * 25, width);
	});
}

function wrapScorerLabels(
	context: CanvasRenderingContext2D,
	labels: string[],
	maxWidth: number,
	fontSize: number
) {
	context.font = `700 ${fontSize}px "Arial Narrow", sans-serif`;
	const lines: string[] = [];
	let currentLine = "";

	labels.forEach((label) => {
		const candidate = currentLine ? `${currentLine} · ${label}` : label;
		if (currentLine && context.measureText(candidate).width > maxWidth) {
			lines.push(currentLine);
			currentLine = label;
		} else {
			currentLine = candidate;
		}
	});

	if (currentLine) lines.push(currentLine);
	return lines;
}

async function drawAssetOrPlaceholder(
	context: CanvasRenderingContext2D,
	asset: SocialGraphicAsset | undefined,
	x: number,
	y: number,
	width: number,
	height: number,
	placeholder: string,
	showFrame: boolean,
	contain: boolean
) {
	if (showFrame) drawRoundedFrame(context, x, y, width, height, 22);

	if (!asset) {
		drawMultilineText(context, placeholder, x + width / 2, y + height / 2, 38, WHITE);
		return;
	}

	const image = await loadTemplateImage(asset.source);
	context.save();
	clipRoundedRect(context, x + 7, y + 7, width - 14, height - 14, 16);
	if (contain) {
		drawContainedImage(context, image, x + 7, y + 7, width - 14, height - 14);
	} else {
		drawImageCover(context, image, x + 7, y + 7, width - 14, height - 14);
	}
	context.restore();
}

async function drawSponsorSlot(
	context: CanvasRenderingContext2D,
	asset: SocialGraphicAsset | undefined,
	x: number,
	y: number
) {
	const width = 395;
	const height = 210;
	drawRoundedFrame(context, x, y, width, height, 20);

	if (!asset) {
		drawMultilineText(context, "SPONSOR\nPLACEHOLDER", x + width / 2, y + height / 2, 36, WHITE);
		return;
	}

	const image = await loadTemplateImage(asset.source);
	drawContainedImage(context, image, x + 28, y + 26, width - 56, height - 52);
}

function drawDividerTitle(context: CanvasRenderingContext2D, title: string, y: number) {
	drawFittedText(context, title, 682.5, y - 2, 500, 64, 53, 28, GOLD, "center");
	context.strokeStyle = GOLD;
	context.lineWidth = 3;
	context.beginPath();
	context.moveTo(65, y + 20);
	context.lineTo(480, y + 20);
	context.moveTo(885, y + 20);
	context.lineTo(1300, y + 20);
	context.stroke();
}

function drawRoundedFrame(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number
) {
	context.strokeStyle = GOLD;
	context.lineWidth = 3;
	roundedRectPath(context, x, y, width, height, radius);
	context.stroke();
}

function clipRoundedRect(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number
) {
	roundedRectPath(context, x, y, width, height, radius);
	context.clip();
}

function roundedRectPath(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number
) {
	const safeRadius = Math.min(radius, width / 2, height / 2);
	context.beginPath();
	context.moveTo(x + safeRadius, y);
	context.arcTo(x + width, y, x + width, y + height, safeRadius);
	context.arcTo(x + width, y + height, x, y + height, safeRadius);
	context.arcTo(x, y + height, x, y, safeRadius);
	context.arcTo(x, y, x + width, y, safeRadius);
	context.closePath();
}

function drawImageCover(
	context: CanvasRenderingContext2D,
	image: HTMLImageElement,
	x: number,
	y: number,
	width: number,
	height: number
) {
	const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
	const renderedWidth = image.naturalWidth * scale;
	const renderedHeight = image.naturalHeight * scale;
	context.drawImage(image, x + (width - renderedWidth) / 2, y + (height - renderedHeight) / 2, renderedWidth, renderedHeight);
}

function drawMultilineText(
	context: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	fontSize: number,
	colour: string
) {
	const lines = text.split("\n");
	context.fillStyle = colour;
	context.font = `700 ${fontSize}px "Arial Narrow", sans-serif`;
	context.textAlign = "center";
	context.textBaseline = "middle";
	lines.forEach((line, index) => {
		context.fillText(line, x, y + (index - (lines.length - 1) / 2) * fontSize * 1.25);
	});
}

function drawCentredText(
	context: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	fontSize: number,
	colour: string
) {
	context.fillStyle = colour;
	context.font = `700 ${fontSize}px "Arial Narrow", sans-serif`;
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillText(text, x, y);
}

function drawFittedText(
	context: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	maxWidth: number,
	lineHeight: number,
	maxFontSize: number,
	minFontSize: number,
	colour: string,
	align: CanvasTextAlign
) {
	let fontSize = maxFontSize;
	while (fontSize > minFontSize) {
		context.font = `700 ${fontSize}px Impact, "Arial Narrow", sans-serif`;
		if (context.measureText(text).width <= maxWidth) break;
		fontSize -= 2;
	}

	context.fillStyle = colour;
	context.font = `700 ${fontSize}px Impact, "Arial Narrow", sans-serif`;
	context.textAlign = align;
	context.textBaseline = "top";
	context.fillText(text, x, y, maxWidth);
	void lineHeight;
}

function getTextField(value: string | boolean | undefined, fallback: string) {
	return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
