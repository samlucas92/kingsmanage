import type { Modifier } from "@dnd-kit/core";

interface PointerCoordinates {
	x: number;
	y: number;
}

function getPointerCoordinates(event: Event): PointerCoordinates | null {
	const pointerEvent = event as Event & {
		clientX?: number;
		clientY?: number;
	};

	if (
		typeof pointerEvent.clientX === "number" &&
		typeof pointerEvent.clientY === "number"
	) {
		return {
			x: pointerEvent.clientX,
			y: pointerEvent.clientY,
		};
	}

	const touchEvent = event as Event & {
		touches?: ArrayLike<{ clientX: number; clientY: number }>;
		changedTouches?: ArrayLike<{ clientX: number; clientY: number }>;
	};
	const touch = touchEvent.touches?.[0] ?? touchEvent.changedTouches?.[0];

	return touch
		? {
				x: touch.clientX,
				y: touch.clientY,
			}
		: null;
}

export const snapPitchOverlayToPointer: Modifier = ({
	activatorEvent,
	draggingNodeRect,
	transform,
}) => {
	if (!activatorEvent || !draggingNodeRect) {
		return transform;
	}

	const pointer = getPointerCoordinates(activatorEvent);

	if (!pointer) {
		return transform;
	}

	const pointerOffsetX = pointer.x - draggingNodeRect.left;
	const pointerOffsetY = pointer.y - draggingNodeRect.top;

	return {
		...transform,
		x: transform.x + pointerOffsetX - draggingNodeRect.width / 2,
		y: transform.y + pointerOffsetY - draggingNodeRect.height / 2,
	};
};
