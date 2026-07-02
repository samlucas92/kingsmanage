import type { Modifier } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";
import { snapPitchOverlayToPointer } from "./dragOverlay";

type ModifierArguments = Parameters<Modifier>[0];

function createModifierArguments(
	overrides: Partial<ModifierArguments> = {}
): ModifierArguments {
	return {
		activatorEvent: null,
		active: null,
		activeNodeRect: null,
		draggingNodeRect: null,
		containerNodeRect: null,
		over: null,
		overlayNodeRect: null,
		scrollableAncestors: [],
		scrollableAncestorRects: [],
		transform: { x: 50, y: 70, scaleX: 1, scaleY: 1 },
		windowRect: null,
		...overrides,
	};
}

describe("snapPitchOverlayToPointer", () => {
	it("centres the pitch overlay on the pointer", () => {
		const result = snapPitchOverlayToPointer(
			createModifierArguments({
				activatorEvent: {
					clientX: 110,
					clientY: 210,
				} as unknown as Event,
				draggingNodeRect: {
					left: 100,
					top: 200,
					width: 64,
					height: 68,
					right: 164,
					bottom: 268,
				},
			})
		);

		expect(result).toEqual({
			x: 28,
			y: 46,
			scaleX: 1,
			scaleY: 1,
		});
	});

	it("leaves the transform unchanged without pointer coordinates", () => {
		const argumentsWithoutPointer = createModifierArguments({
			activatorEvent: {} as Event,
			draggingNodeRect: {
				left: 100,
				top: 200,
				width: 64,
				height: 68,
				right: 164,
				bottom: 268,
			},
		});

		expect(snapPitchOverlayToPointer(argumentsWithoutPointer)).toBe(
			argumentsWithoutPointer.transform
		);
	});
});
