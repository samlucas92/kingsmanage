import type { TemplateElementBounds } from "./upcomingTemplateElements";

export type CanvasTemplateElement = TemplateElementBounds & {
	id: string;
	label: string;
	minimumWidth: number;
	minimumHeight: number;
	resizeMode?: "both" | "horizontal" | "square" | "none";
	constraint?: TemplateElementBounds;
	allowOverflow?: boolean;
};

export function clampMovedBounds(
	element: CanvasTemplateElement,
	deltaX: number,
	deltaY: number,
	canvasWidth: number,
	canvasHeight: number
): TemplateElementBounds {
	const left = element.constraint?.x ?? 0;
	const top = element.constraint?.y ?? 0;
	const right = element.constraint
		? element.constraint.x + element.constraint.width
		: canvasWidth;
	const bottom = element.constraint
		? element.constraint.y + element.constraint.height
		: canvasHeight;
	const minimumX = element.allowOverflow
		? left - element.width + element.minimumWidth
		: left;
	const maximumX = element.allowOverflow
		? right - element.minimumWidth
		: right - element.width;
	const minimumY = element.allowOverflow
		? top - element.height + element.minimumHeight
		: top;
	const maximumY = element.allowOverflow
		? bottom - element.minimumHeight
		: bottom - element.height;

	return {
		x: clamp(element.x + deltaX, minimumX, maximumX),
		y: clamp(element.y + deltaY, minimumY, maximumY),
		width: element.width,
		height: element.height,
	};
}

function clamp(value: number, minimum: number, maximum: number) {
	return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}
