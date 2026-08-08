import { loadTemplateImage } from "../socialGraphicCanvas";
import type {
	SocialGraphicAsset,
	SocialScorer,
	SocialGraphicTemplate,
	SocialGraphicTemplateRenderContext,
} from "../types";

const GOLD = "#d7a600";
const WHITE = "#f4f4f2";
const BLACK = "#050606";

export const resultEditorialTemplate: SocialGraphicTemplate = {
	id: "result-editorial-gold",
	name: "Editorial result",
	description: "Black and gold result layout with optional featured and sponsor imagery.",
	width: 1365,
	height: 1651,
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
			defaultValue: "Match sponsors",
		},
	],
	render: renderResultEditorialTemplate,
};

async function renderResultEditorialTemplate({
	context,
	width,
	height,
	content,
}: SocialGraphicTemplateRenderContext) {
	const fixture = content.fixtures[0];
	const showSponsors = content.fields.showSponsors !== false;
	const sponsorTop = showSponsors ? 1302 : height - 38;
	const contentBottom = showSponsors ? 1242 : height - 56;

	context.save();
	drawBackground(context, width, height);
	drawBorder(context, width, height);

	if (!fixture?.result) {
		drawCentredText(context, "SELECT A COMPLETED RESULT", width / 2, height / 2, 54, WHITE);
		context.restore();
		return;
	}

	const homeTeam = fixture.venue === "home" ? fixture.teamName : fixture.opponent;
	const awayTeam = fixture.venue === "away" ? fixture.teamName : fixture.opponent;
	const competition = fixture.competition || "Competition";

	drawSectionTitle(context, competition, 108, 90, 950);
	drawFittedText(context, content.headline.toUpperCase(), 62, 150, 940, 204, 198, 82, WHITE, "left");

	await drawAssetOrPlaceholder(
		context,
		content.assets.homeTeamLogo,
		1050,
		164,
		210,
		180,
		"HOME TEAM\nLOGO",
		false
	);

	context.strokeStyle = GOLD;
	context.lineWidth = 5;
	context.beginPath();
	context.moveTo(810, 448);
	context.lineTo(810, contentBottom);
	context.stroke();

	await drawTeamRow({
		context,
		y: 505,
		teamName: homeTeam,
		score: fixture.result.homeGoals,
		asset: content.assets.homeTeamLogo,
		label: "HOME TEAM\nLOGO",
		scorers: fixture.venue === "home" ? fixture.scorers : [],
	});

	context.strokeStyle = GOLD;
	context.lineWidth = 3;
	context.beginPath();
	context.moveTo(66, 866);
	context.lineTo(756, 866);
	context.stroke();

	await drawTeamRow({
		context,
		y: 942,
		teamName: awayTeam,
		score: fixture.result.awayGoals,
		asset: content.assets.awayTeamLogo,
		label: "AWAY TEAM\nLOGO",
		scorers: fixture.venue === "away" ? fixture.scorers : [],
	});

	const featuredTitle = getTextField(content.fields.featuredTitle, "Player of the match");
	drawFittedText(context, featuredTitle.toUpperCase(), 1079, 474, 390, 58, 46, 24, GOLD, "center");
	await drawAssetOrPlaceholder(
		context,
		content.assets.featuredImage,
		864,
		554,
		430,
		contentBottom - 574,
		"PLAYER IMAGE",
		true
	);
	if (fixture.playerOfTheMatch.trim()) {
		const captionTop = contentBottom - 118;
		context.fillStyle = "rgba(0,0,0,.82)";
		context.fillRect(868, captionTop, 422, 94);
		drawFittedText(
			context,
			fixture.playerOfTheMatch.toUpperCase(),
			1079,
			captionTop + 23,
			378,
			48,
			42,
			22,
			WHITE,
			"center"
		);
	}

	if (showSponsors) {
		const sponsorsTitle = getTextField(content.fields.sponsorsTitle, "Match sponsors");
		drawDividerTitle(context, sponsorsTitle.toUpperCase(), sponsorTop);
		await Promise.all([
			drawSponsorSlot(context, content.assets.sponsors[0], 52, sponsorTop + 52),
			drawSponsorSlot(context, content.assets.sponsors[1], 487, sponsorTop + 52),
			drawSponsorSlot(context, content.assets.sponsors[2], 922, sponsorTop + 52),
		]);
	}

	context.restore();
}

function drawBackground(context: CanvasRenderingContext2D, width: number, height: number) {
	context.fillStyle = BLACK;
	context.fillRect(0, 0, width, height);

	const glow = context.createRadialGradient(width * 0.46, height * 0.42, 30, width * 0.46, height * 0.42, 770);
	glow.addColorStop(0, "rgba(38,38,34,.22)");
	glow.addColorStop(1, "rgba(0,0,0,0)");
	context.fillStyle = glow;
	context.fillRect(0, 0, width, height);

	context.fillStyle = "rgba(215,166,0,.13)";
	for (let row = 0; row < 17; row += 1) {
		for (let column = 0; column < 7; column += 1) {
			const radius = Math.max(1.2, 5.8 - column * 0.72);
			context.beginPath();
			context.arc(28 + column * 18, 190 + row * 20, radius, 0, Math.PI * 2);
			context.fill();
		}
	}

	context.fillStyle = "rgba(255,255,255,.025)";
	for (let index = 0; index < 220; index += 1) {
		const x = (index * 83) % width;
		const y = (index * 137) % height;
		context.fillRect(x, y, 2, 2);
	}
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
	await drawAssetOrPlaceholder(context, asset, 70, y, 235, 276, label, true);
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
	showFrame: boolean
) {
	if (showFrame) drawRoundedFrame(context, x, y, width, height, 22);

	if (!asset) {
		drawMultilineText(context, placeholder, x + width / 2, y + height / 2, 38, WHITE);
		return;
	}

	const image = await loadTemplateImage(asset.source);
	context.save();
	clipRoundedRect(context, x + 7, y + 7, width - 14, height - 14, 16);
	drawImageCover(context, image, x + 7, y + 7, width - 14, height - 14);
	context.restore();
}

async function drawSponsorSlot(
	context: CanvasRenderingContext2D,
	asset: SocialGraphicAsset | undefined,
	x: number,
	y: number
) {
	const width = 395;
	const height = 230;
	drawRoundedFrame(context, x, y, width, height, 20);

	if (!asset) {
		drawMultilineText(context, "SPONSOR\nPLACEHOLDER", x + width / 2, y + height / 2, 36, WHITE);
		return;
	}

	const image = await loadTemplateImage(asset.source);
	drawImageContain(context, image, x + 28, y + 26, width - 56, height - 52);
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

function drawImageContain(
	context: CanvasRenderingContext2D,
	image: HTMLImageElement,
	x: number,
	y: number,
	width: number,
	height: number
) {
	const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
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
