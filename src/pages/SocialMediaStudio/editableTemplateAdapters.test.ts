import { describe, expect, it } from "vitest";

import { staticEditableTemplateAdapters } from "./editableTemplateAdapters";

describe("static editable social templates", () => {
	it.each(staticEditableTemplateAdapters)(
		"round-trips and renders $id from its editable definition",
		(adapter) => {
			const definition = adapter.parse(adapter.defaultSource);
			const template = adapter.create(definition);

			expect(adapter.serialize(definition)).toBe(adapter.defaultSource);
			expect(template.id).toBe(adapter.id);
			expect(template.width).toBe(definition.canvas.width);
			expect(template.height).toBe(definition.canvas.height);
		}
	);

	it.each(staticEditableTemplateAdapters)(
		"rejects an out-of-canvas element for $id",
		(adapter) => {
			const candidate = JSON.parse(adapter.defaultSource) as {
				canvas: { width: number };
				elements: Record<string, { x: number }>;
			};
			const firstElement = Object.keys(candidate.elements)[0];
			candidate.elements[firstElement].x = candidate.canvas.width + 1;

			expect(() => adapter.parse(JSON.stringify(candidate))).toThrow(
				"must stay within the canvas"
			);
		}
	);

	it("allows the player image to extend beyond the canvas while it remains visible", () => {
		const adapter = staticEditableTemplateAdapters.find(
			(candidate) => candidate.id === "player-portrait-club"
		);
		if (!adapter) throw new Error("Player portrait adapter is missing.");
		const candidate = JSON.parse(adapter.defaultSource) as {
			elements: Record<string, { y: number }>;
		};
		candidate.elements["player-image"].y = 200;

		const parsed = adapter.parse(JSON.stringify(candidate));
		const elements = parsed.elements as Record<string, { y: number }>;

		expect(elements["player-image"].y).toBe(200);
	});
});
