import type { SocialGraphicContent, SocialGraphicTemplate } from "./types";

export const SOCIAL_EXPORT_WIDTH = 1080;
export const SOCIAL_EXPORT_HEIGHT = 1350;

export function getSocialGraphicDimensions(
	template: SocialGraphicTemplate,
	content: SocialGraphicContent
) {
	return {
		width: template.width,
		height: template.resolveHeight?.(content) ?? template.height,
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
	if (sourceCanvas.width === SOCIAL_EXPORT_WIDTH && sourceCanvas.height === SOCIAL_EXPORT_HEIGHT) {
		return sourceCanvas;
	}

	const exportCanvas = document.createElement("canvas");
	exportCanvas.width = SOCIAL_EXPORT_WIDTH;
	exportCanvas.height = SOCIAL_EXPORT_HEIGHT;
	const context = exportCanvas.getContext("2d");
	if (!context) {
		throw new Error("This browser cannot resize the social graphic for export.");
	}

	context.imageSmoothingEnabled = true;
	context.imageSmoothingQuality = "high";
	context.drawImage(sourceCanvas, 0, 0, SOCIAL_EXPORT_WIDTH, SOCIAL_EXPORT_HEIGHT);
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
