import { describe, expect, it } from "vitest";
import { sportDefinitions } from "../constants/sports";
import { resolveLineupPosition } from "./lineupPosition";

const formation = sportDefinitions.football.formations.find((item) => item.key === "4-3-3")!.slots;

describe("resolveLineupPosition", () => {
	it("resolves a semantic position key from the sport definition", () => {
		const result = resolveLineupPosition({ positionKey: "st" }, formation);

		expect(result).toMatchObject({ x: 50, y: 20, source: "definition" });
		expect(result.slot?.label).toBe("ST");
	});

	it("uses custom coordinates only as an explicit override", () => {
		const result = resolveLineupPosition({ positionKey: "st", x: 46, y: 18 }, formation);

		expect(result).toMatchObject({ x: 46, y: 18, source: "custom" });
		expect(result.slot?.key).toBe("st");
	});

	it("supports partially supplied drag overrides", () => {
		expect(resolveLineupPosition({ positionKey: "st", x: 45 }, formation)).toMatchObject({
			x: 45,
			y: 20,
			source: "custom",
		});
	});

	it("falls back to the legacy position index for existing lineups", () => {
		const result = resolveLineupPosition({ positionIndex: 0 }, formation);

		expect(result).toMatchObject({ x: 50, y: 88, source: "definition" });
		expect(result.slot?.key).toBe("gk");
	});

	it("prefers a semantic key over a conflicting legacy index", () => {
		const result = resolveLineupPosition({ positionKey: "st", positionIndex: 0 }, formation);

		expect(result.slot?.key).toBe("st");
	});

	it("uses the centre of the surface when no valid placement exists", () => {
		expect(resolveLineupPosition({ positionKey: "missing" }, formation)).toEqual({
			x: 50,
			y: 50,
			source: "fallback",
		});
	});
});
