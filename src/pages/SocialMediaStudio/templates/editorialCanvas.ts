import { loadTemplateImage } from "../socialGraphicCanvas";
import type { SocialGraphicAsset } from "../types";

export const EDITORIAL_GOLD = "#d7a600";
export const EDITORIAL_WHITE = "#f4f4f2";
export const EDITORIAL_BLACK = "#050606";

type ImageContentBounds = {
	x: number;
	y: number;
	width: number;
	height: number;
};

const imageContentBoundsCache = new Map<string, ImageContentBounds>();

export function drawEditorialBackground(
	context: CanvasRenderingContext2D,
	width: number,
	height: number,
	colours: { background?: string; accent?: string } = {}
) {
	context.fillStyle = colours.background ?? EDITORIAL_BLACK;
	context.fillRect(0, 0, width, height);

	const glow = context.createRadialGradient(width * 0.48, height * 0.42, 20, width * 0.48, height * 0.42, width * 0.62);
	glow.addColorStop(0, "rgba(38,38,34,.2)");
	glow.addColorStop(1, "rgba(0,0,0,0)");
	context.fillStyle = glow;
	context.fillRect(0, 0, width, height);

	const dotFadeWidth = width * 0.5;
	const dotSpacing = 26;
	context.fillStyle = colours.accent ?? EDITORIAL_GOLD;
	for (let y = 48; y < height - 40; y += dotSpacing) {
		for (let x = 28; x < dotFadeWidth; x += dotSpacing) {
			const fade = Math.max(0, 1 - x / dotFadeWidth);
			context.globalAlpha = 0.2 * fade * fade;
			context.beginPath();
			context.arc(x, y, 3.8, 0, Math.PI * 2);
			context.fill();
		}
	}
	context.globalAlpha = 1;

	context.fillStyle = "rgba(255,255,255,.025)";
	for (let index = 0; index < 220; index += 1) {
		context.fillRect((index * 83) % width, (index * 137) % height, 2, 2);
	}
}

export function drawEditorialBorder(
	context: CanvasRenderingContext2D,
	width: number,
	height: number,
	colour = EDITORIAL_GOLD
) {
	context.strokeStyle = colour;
	context.lineWidth = 3;
	context.strokeRect(20, 20, width - 40, height - 40);
}

export function drawEditorialSectionTitle(
	context: CanvasRenderingContext2D,
	text: string,
	y: number,
	width: number,
	maxTextWidth = 520,
	colour = EDITORIAL_GOLD,
	centerX = width / 2
) {
	drawFittedText(context, text.toUpperCase(), centerX, y - 26, maxTextWidth, 50, 24, colour, "center");
	context.strokeStyle = colour;
	context.lineWidth = 3;
	context.beginPath();
	context.moveTo(88, y);
	context.lineTo(centerX - maxTextWidth / 2 - 35, y);
	context.moveTo(centerX + maxTextWidth / 2 + 35, y);
	context.lineTo(width - 88, y);
	context.stroke();
}

export function drawRoundedFrame(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius = 20,
	colour = EDITORIAL_GOLD
) {
	context.strokeStyle = colour;
	context.lineWidth = 3;
	roundedRectPath(context, x, y, width, height, radius);
	context.stroke();
}

export async function drawAssetOrPlaceholder(
	context: CanvasRenderingContext2D,
	asset: SocialGraphicAsset | undefined,
	x: number,
	y: number,
	width: number,
	height: number,
	placeholder: string,
	options: {
		frame?: boolean;
		contain?: boolean;
		frameColour?: string;
		placeholderColour?: string;
	} = {}
) {
	if (options.frame !== false) {
		drawRoundedFrame(context, x, y, width, height, 20, options.frameColour);
	}

	if (!asset) {
		drawMultilineText(context, placeholder, x + width / 2, y + height / 2, Math.min(31, width / 8), options.placeholderColour ?? EDITORIAL_WHITE);
		return;
	}

	const image = await loadTemplateImage(asset.source);
	const innerX = x + 8;
	const innerY = y + 8;
	const innerWidth = width - 16;
	const innerHeight = height - 16;
	context.save();
	clipRoundedRect(context, innerX, innerY, innerWidth, innerHeight, 14);
	if (options.contain) {
		drawImageContain(context, image, innerX, innerY, innerWidth, innerHeight);
	} else {
		drawImageCover(context, image, innerX, innerY, innerWidth, innerHeight);
	}
	context.restore();
}

export function drawFittedText(
	context: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	maxWidth: number,
	maxFontSize: number,
	minFontSize: number,
	colour: string,
	align: CanvasTextAlign = "left"
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
}

export function drawMultilineText(
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

export function drawWrappedText(
	context: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	maxWidth: number,
	maxLines: number,
	maxFontSize: number,
	minFontSize: number,
	colour: string,
	align: CanvasTextAlign = "left"
) {
	let fontSize = maxFontSize;
	let lines = wrapText(context, text, maxWidth, fontSize);
	while (lines.length > maxLines && fontSize > minFontSize) {
		fontSize -= 1;
		lines = wrapText(context, text, maxWidth, fontSize);
	}

	if (lines.length > maxLines) {
		lines = lines.slice(0, maxLines);
		let finalLine = `${lines[maxLines - 1]}…`;
		context.font = `700 ${fontSize}px Impact, "Arial Narrow", sans-serif`;
		while (finalLine.length > 1 && context.measureText(finalLine).width > maxWidth) {
			finalLine = `${finalLine.slice(0, -2)}…`;
		}
		lines[maxLines - 1] = finalLine;
	}

	context.fillStyle = colour;
	context.font = `700 ${fontSize}px Impact, "Arial Narrow", sans-serif`;
	context.textAlign = align;
	context.textBaseline = "top";
	lines.forEach((line, index) => {
		context.fillText(line, x, y + index * fontSize * 1.12, maxWidth);
	});
}

export function drawCalendarIcon(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	size: number,
	colour = EDITORIAL_GOLD
) {
	context.strokeStyle = colour;
	context.lineWidth = Math.max(3, size * 0.07);
	drawRoundedFrame(context, x, y + size * 0.14, size, size * 0.82, size * 0.1, colour);
	context.beginPath();
	context.moveTo(x + size * 0.22, y);
	context.lineTo(x + size * 0.22, y + size * 0.28);
	context.moveTo(x + size * 0.78, y);
	context.lineTo(x + size * 0.78, y + size * 0.28);
	context.moveTo(x, y + size * 0.42);
	context.lineTo(x + size, y + size * 0.42);
	context.stroke();
	context.fillStyle = colour;
	for (let row = 0; row < 2; row += 1) {
		for (let column = 0; column < 3; column += 1) {
			context.fillRect(x + size * (0.19 + column * 0.25), y + size * (0.55 + row * 0.22), size * 0.1, size * 0.1);
		}
	}
}

export function drawLocationIcon(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	size: number,
	colour = EDITORIAL_GOLD,
	backgroundColour = EDITORIAL_BLACK
) {
	context.fillStyle = colour;
	context.beginPath();
	context.arc(x, y, size * 0.32, Math.PI, 0);
	context.quadraticCurveTo(x + size * 0.33, y + size * 0.46, x, y + size);
	context.quadraticCurveTo(x - size * 0.33, y + size * 0.46, x - size * 0.32, y);
	context.closePath();
	context.fill();
	context.fillStyle = backgroundColour;
	context.beginPath();
	context.arc(x, y, size * 0.12, 0, Math.PI * 2);
	context.fill();
}

export function drawClockIcon(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	size: number,
	colour = EDITORIAL_GOLD
) {
	context.strokeStyle = colour;
	context.lineWidth = Math.max(3, size * 0.07);
	context.beginPath();
	context.arc(x, y, size / 2, 0, Math.PI * 2);
	context.moveTo(x, y);
	context.lineTo(x, y - size * 0.28);
	context.moveTo(x, y);
	context.lineTo(x + size * 0.22, y + size * 0.16);
	context.stroke();
}

export function drawShieldPlaceholder(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	colour = EDITORIAL_GOLD
) {
	context.strokeStyle = colour;
	context.lineWidth = 5;
	context.beginPath();
	context.moveTo(x + width / 2, y);
	context.bezierCurveTo(x + width * 0.68, y + height * 0.12, x + width * 0.82, y + height * 0.14, x + width, y + height * 0.16);
	context.lineTo(x + width, y + height * 0.58);
	context.bezierCurveTo(x + width, y + height * 0.78, x + width * 0.7, y + height * 0.95, x + width / 2, y + height);
	context.bezierCurveTo(x + width * 0.3, y + height * 0.95, x, y + height * 0.78, x, y + height * 0.58);
	context.lineTo(x, y + height * 0.16);
	context.bezierCurveTo(x + width * 0.18, y + height * 0.14, x + width * 0.32, y + height * 0.12, x + width / 2, y);
	context.stroke();
}

export function getTextField(value: string | boolean | undefined, fallback: string) {
	return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function wrapText(
	context: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
	fontSize: number
) {
	context.font = `700 ${fontSize}px Impact, "Arial Narrow", sans-serif`;
	const words = text.trim().split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let line = "";

	words.forEach((word) => {
		const candidate = line ? `${line} ${word}` : word;
		if (line && context.measureText(candidate).width > maxWidth) {
			lines.push(line);
			line = word;
		} else {
			line = candidate;
		}
	});

	if (line) lines.push(line);
	return lines.length > 0 ? lines : [""];
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

export function drawImageContain(
	context: CanvasRenderingContext2D,
	image: HTMLImageElement,
	x: number,
	y: number,
	width: number,
	height: number
) {
	const bounds = getImageContentBounds(image);
	const scale = Math.min(width / bounds.width, height / bounds.height);
	const renderedWidth = bounds.width * scale;
	const renderedHeight = bounds.height * scale;
	context.drawImage(
		image,
		bounds.x,
		bounds.y,
		bounds.width,
		bounds.height,
		x + (width - renderedWidth) / 2,
		y + (height - renderedHeight) / 2,
		renderedWidth,
		renderedHeight
	);
}

function getImageContentBounds(image: HTMLImageElement): ImageContentBounds {
	const cacheKey = image.currentSrc || image.src;
	const cachedBounds = imageContentBoundsCache.get(cacheKey);
	if (cachedBounds) return cachedBounds;

	const fallbackBounds = {
		x: 0,
		y: 0,
		width: image.naturalWidth,
		height: image.naturalHeight,
	};

	try {
		const sampleScale = Math.min(1, 256 / Math.max(image.naturalWidth, image.naturalHeight));
		const sampleWidth = Math.max(1, Math.round(image.naturalWidth * sampleScale));
		const sampleHeight = Math.max(1, Math.round(image.naturalHeight * sampleScale));
		const sampleCanvas = document.createElement("canvas");
		sampleCanvas.width = sampleWidth;
		sampleCanvas.height = sampleHeight;
		const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
		if (!sampleContext) return fallbackBounds;

		sampleContext.drawImage(image, 0, 0, sampleWidth, sampleHeight);
		const pixels = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight).data;
		let left = sampleWidth;
		let top = sampleHeight;
		let right = -1;
		let bottom = -1;

		for (let pixelIndex = 0; pixelIndex < sampleWidth * sampleHeight; pixelIndex += 1) {
			if (pixels[pixelIndex * 4 + 3] <= 8) continue;
			const pixelX = pixelIndex % sampleWidth;
			const pixelY = Math.floor(pixelIndex / sampleWidth);
			left = Math.min(left, pixelX);
			top = Math.min(top, pixelY);
			right = Math.max(right, pixelX);
			bottom = Math.max(bottom, pixelY);
		}

		if (right < left || bottom < top) return fallbackBounds;
		const bounds = {
			x: left / sampleScale,
			y: top / sampleScale,
			width: (right - left + 1) / sampleScale,
			height: (bottom - top + 1) / sampleScale,
		};
		imageContentBoundsCache.set(cacheKey, bounds);
		return bounds;
	} catch {
		return fallbackBounds;
	}
}
