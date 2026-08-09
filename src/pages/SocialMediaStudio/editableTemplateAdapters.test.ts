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
});
