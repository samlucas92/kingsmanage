import { describe, expect, it } from "vitest";

import { drawEditorialBackground, drawWrappedText } from "./editorialCanvas";

describe("editorial background", () => {
	it("draws the dot texture across the canvas and starts fading after the first 15 percent", () => {
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
		expect(dots.find((dot) => dot.x === 132)?.alpha).toBeCloseTo(dots[0].alpha);
		expect(dots.find((dot) => dot.x === 158)?.alpha).toBeLessThan(dots[0].alpha);
		expect(dots.find((dot) => dot.x === 262)?.alpha).toBeLessThan(0.16);
		expect(dots.find((dot) => dot.x === 756)?.alpha).toBeLessThan(dots[0].alpha);
		expect(dots[0].alpha).toBeGreaterThan(dots.at(-1)?.alpha ?? 1);
		expect(context.globalAlpha).toBe(1);
	});
});

describe("editorial text wrapping", () => {
	it("reduces long text to fit both the available width and row height", () => {
		const drawnLines: Array<{ text: string; font: string; y: number }> = [];
		let currentFont = "";
		const context = {
			fillStyle: "",
			textAlign: "left",
			textBaseline: "top",
			get font() { return currentFont; },
			set font(value: string) { currentFont = value; },
			measureText(text: string) {
				const fontSize = Number.parseInt(currentFont.match(/(\d+)px/)?.[1] ?? "16", 10);
				return { width: text.length * fontSize * 0.5 } as TextMetrics;
			},
			fillText(text: string, _x: number, y: number) {
				drawnLines.push({ text, font: currentFont, y });
			},
		} as unknown as CanvasRenderingContext2D;

		drawWrappedText(
			context,
			"SWANSEA SENIOR LEAGUE DIVISION ONE",
			0,
			0,
			210,
			2,
			27,
			9,
			"#ffffff",
			"left",
			42
		);

		expect(drawnLines).toHaveLength(2);
		const fontSize = Number.parseInt(drawnLines[0].font.match(/(\d+)px/)?.[1] ?? "0", 10);
		expect(fontSize).toBeLessThan(27);
		expect(drawnLines[1].y + fontSize).toBeLessThanOrEqual(42);
	});
});
