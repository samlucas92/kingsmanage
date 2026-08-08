import type { SocialGraphicContent, SocialGraphicTemplate } from "./types";

export async function renderSocialGraphic(
	canvas: HTMLCanvasElement,
	template: SocialGraphicTemplate,
	content: SocialGraphicContent
) {
	canvas.width = template.width;
	canvas.height = template.height;

	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error("This browser cannot create the social graphic preview.");
	}

	context.clearRect(0, 0, template.width, template.height);
	await template.render({
		canvas,
		context,
		width: template.width,
		height: template.height,
		content,
	});
}

export function canvasToPngBlob(canvas: HTMLCanvasElement) {
	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) {
				resolve(blob);
				return;
			}

			reject(new Error("The browser could not create a PNG from this graphic."));
		}, "image/png");
	});
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

