import type { SocialGraphicContent, SocialGraphicTemplate } from "./types";

export const SOCIAL_EXPORT_MAX_WIDTH = 1080;
export const SOCIAL_EXPORT_MAX_HEIGHT = 1350;

export function getSocialGraphicDimensions(
	template: SocialGraphicTemplate,
	content: SocialGraphicContent
) {
	return {
		width: template.width,
		height: template.resolveHeight?.(content) ?? template.height,
	};
}

export function getSocialExportDimensions(width: number, height: number) {
	if (width <= 0 || height <= 0) {
		return { width: SOCIAL_EXPORT_MAX_WIDTH, height: SOCIAL_EXPORT_MAX_HEIGHT };
	}

	const scale = Math.min(
		1,
		SOCIAL_EXPORT_MAX_WIDTH / width,
		SOCIAL_EXPORT_MAX_HEIGHT / height
	);
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale)),
	};
}

export async function renderSocialGraphic(
	canvas: HTMLCanvasElement,
	template: SocialGraphicTemplate,
	content: SocialGraphicContent
) {
	const { width, height } = getSocialGraphicDimensions(template, content);
	canvas.width = width;
	canvas.height = height;

	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error("This browser cannot create the social graphic preview.");
	}

	context.clearRect(0, 0, width, height);
	await template.render({
		canvas,
		context,
		width,
		height,
		content,
	});

	if (content.kind === "fixture" && content.isPostponed) {
		drawPostponedOverlay(context, width, height);
	}
}

export function drawPostponedOverlay(
	context: CanvasRenderingContext2D,
	width: number,
	height: number
) {
	context.save();
	context.translate(width / 2, height / 2);
	context.rotate(-Math.PI / 7);
	const bandHeight = Math.max(150, Math.round(Math.min(width, height) * 0.16));
	context.fillStyle = "rgba(185, 28, 28, 0.94)";
	context.fillRect(-width, -bandHeight / 2, width * 2, bandHeight);
	context.strokeStyle = "rgba(255, 255, 255, 0.95)";
	context.lineWidth = Math.max(5, Math.round(bandHeight * 0.045));
	context.strokeRect(-width, -bandHeight / 2, width * 2, bandHeight);
	context.fillStyle = "#ffffff";
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.font = `900 ${Math.round(bandHeight * 0.5)}px Arial, sans-serif`;
	context.shadowColor = "rgba(0, 0, 0, 0.35)";
	context.shadowBlur = 14;
	context.fillText("POSTPONED", 0, 5, width * 0.86);
	context.restore();
}

export function canvasToPngBlob(canvas: HTMLCanvasElement) {
	const exportCanvas = createSocialExportCanvas(canvas);
	return new Promise<Blob>((resolve, reject) => {
		exportCanvas.toBlob((blob) => {
			if (blob) {
				resolve(blob);
				return;
			}

			reject(new Error("The browser could not create a PNG from this graphic."));
		}, "image/png");
	});
}

export function canvasToJpegBlob(canvas: HTMLCanvasElement, quality = 0.92) {
	const exportCanvas = createSocialExportCanvas(canvas);
	return new Promise<Blob>((resolve, reject) => {
		exportCanvas.toBlob((blob) => {
			if (blob) {
				resolve(blob);
				return;
			}
			reject(new Error("The browser could not create a JPEG from this graphic."));
		}, "image/jpeg", quality);
	});
}

function createSocialExportCanvas(sourceCanvas: HTMLCanvasElement) {
	const dimensions = getSocialExportDimensions(
		sourceCanvas.width,
		sourceCanvas.height
	);
	if (
		sourceCanvas.width === dimensions.width &&
		sourceCanvas.height === dimensions.height
	) {
		return sourceCanvas;
	}

	const exportCanvas = document.createElement("canvas");
	exportCanvas.width = dimensions.width;
	exportCanvas.height = dimensions.height;
	const context = exportCanvas.getContext("2d");
	if (!context) {
		throw new Error("This browser cannot resize the social graphic for export.");
	}

	context.imageSmoothingEnabled = true;
	context.imageSmoothingQuality = "high";
	context.drawImage(sourceCanvas, 0, 0, dimensions.width, dimensions.height);
	return exportCanvas;
}

export async function copyCanvasPng(canvas: HTMLCanvasElement) {
	if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
		throw new Error("Image copying is not supported here. Download the PNG instead.");
	}

	const blob = await canvasToPngBlob(canvas);
	await navigator.clipboard.write([
		new ClipboardItem({ [blob.type]: blob }),
	]);
}

export async function downloadCanvasPng(
	canvas: HTMLCanvasElement,
	filename: string
) {
	const blob = await canvasToPngBlob(canvas);
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

export function loadTemplateImage(source: string) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error(`Could not load template asset: ${source}`));
		image.src = source;
	});
}
