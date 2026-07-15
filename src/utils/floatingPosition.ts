export type FloatingAlignment = "left" | "right";

type FloatingPositionInput = {
	anchorRect: DOMRect;
	floatingWidth: number;
	floatingHeight: number;
	align?: FloatingAlignment;
	offset?: number;
	viewportPadding?: number;
	bottomPadding?: number;
};

export type FloatingPosition = {
	left: number;
	top: number;
	maxHeight: number;
	placement: "top" | "bottom";
};

export function getFloatingPosition({
	anchorRect,
	floatingWidth,
	floatingHeight,
	align = "right",
	offset = 8,
	viewportPadding = 12,
	bottomPadding = viewportPadding,
}: FloatingPositionInput): FloatingPosition {
	const viewport = window.visualViewport;
	const viewportWidth = viewport?.width ?? window.innerWidth;
	const viewportHeight = viewport?.height ?? window.innerHeight;
	const viewportLeft = viewport?.offsetLeft ?? 0;
	const viewportTop = viewport?.offsetTop ?? 0;
	const safeLeft = viewportLeft + viewportPadding;
	const safeRight = viewportLeft + viewportWidth - viewportPadding;
	const safeTop = viewportTop + viewportPadding;
	const safeBottom = viewportTop + viewportHeight - bottomPadding;
	const preferredLeft =
		align === "right"
			? anchorRect.right - floatingWidth
			: anchorRect.left;
	const left = clamp(preferredLeft, safeLeft, safeRight - floatingWidth);
	const belowSpace = safeBottom - anchorRect.bottom - offset;
	const aboveSpace = anchorRect.top - safeTop - offset;
	const opensUp = aboveSpace > belowSpace && belowSpace < floatingHeight;
	const availableHeight = Math.max(
		96,
		opensUp ? aboveSpace : belowSpace
	);
	const renderedHeight = Math.min(floatingHeight, availableHeight);
	const top = opensUp
		? Math.max(safeTop, anchorRect.top - offset - renderedHeight)
		: Math.min(anchorRect.bottom + offset, safeBottom - renderedHeight);

	return {
		left,
		top,
		maxHeight: availableHeight,
		placement: opensUp ? "top" : "bottom",
	};
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), Math.max(min, max));
}
