import { describe, expect, it } from "vitest";

import { drawEditorialBackground } from "./editorialCanvas";

describe("editorial background", () => {
	it("draws the dot texture across the canvas and starts fading after the first quarter", () => {
		const dots: Array<{ x: number; y: number; alpha: number }> = [];
		let currentAlpha = 1;
		const context = {
			fillStyle: "",
			get globalAlpha() { return currentAlpha; },
			set globalAlpha(value: number) { currentAlpha = value; },
			fillRect: () => undefined,
			createRadialGradient: () => ({ addColorStop: () => undefined }),
			beginPath: () => undefined,
			arc(x: number, y: number) {
				dots.push({ x, y, alpha: currentAlpha });
			},
			fill: () => undefined,
		} as unknown as CanvasRenderingContext2D;

		drawEditorialBackground(context, 1000, 1200);

		expect(Math.max(...dots.map((dot) => dot.y))).toBeGreaterThan(1100);
		expect(Math.max(...dots.map((dot) => dot.x))).toBeGreaterThan(900);
		expect(dots[0].alpha).toBeGreaterThan(0.17);
		expect(dots.find((dot) => dot.x === 236)?.alpha).toBeCloseTo(dots[0].alpha);
		expect(dots.find((dot) => dot.x === 262)?.alpha).toBeLessThan(dots[0].alpha);
		expect(dots.find((dot) => dot.x === 756)?.alpha).toBeLessThan(dots[0].alpha);
		expect(dots[0].alpha).toBeGreaterThan(dots.at(-1)?.alpha ?? 1);
		expect(context.globalAlpha).toBe(1);
	});
});
