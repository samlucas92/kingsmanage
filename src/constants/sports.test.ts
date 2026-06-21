import { describe, expect, it } from "vitest";
import { getSportDefinition, sportDefinitions } from "./sports";

describe("sport definitions", () => {
	it("contains the initial supported sports", () => {
		expect(Object.keys(sportDefinitions)).toEqual(
			expect.arrayContaining(["football", "rugby-union", "cricket", "hockey", "netball"])
		);
	});

	it.each([
		["football", 11],
		["rugby-union", 15],
		["cricket", 11],
		["hockey", 11],
		["netball", 7],
	])("defines the correct squad size for %s", (sportKey, playersPerSide) => {
		expect(getSportDefinition(sportKey).playersPerSide).toBe(playersPerSide);
	});

	it("falls back to football for a missing or unknown legacy sport key", () => {
		expect(getSportDefinition().key).toBe("football");
		expect(getSportDefinition("unknown").key).toBe("football");
	});

	it("uses unique semantic player-position keys within each sport", () => {
		for (const sport of Object.values(sportDefinitions)) {
			const keys = sport.positions.map((position) => position.key);
			expect(new Set(keys).size, `${sport.key} position keys`).toBe(keys.length);
		}
	});

	it("provides complete, valid and uniquely keyed formation layouts", () => {
		for (const sport of Object.values(sportDefinitions)) {
			expect(sport.formations.length, `${sport.key} formations`).toBeGreaterThan(0);

			for (const formation of sport.formations) {
				expect(formation.slots, `${sport.key}/${formation.key} size`).toHaveLength(sport.playersPerSide);
				const slotKeys = formation.slots.map((slot) => slot.key);
				expect(new Set(slotKeys).size, `${sport.key}/${formation.key} slot keys`).toBe(slotKeys.length);

				for (const slot of formation.slots) {
					expect(slot.x, `${sport.key}/${formation.key}/${slot.key} x`).toBeGreaterThanOrEqual(0);
					expect(slot.x).toBeLessThanOrEqual(100);
					expect(slot.y, `${sport.key}/${formation.key}/${slot.key} y`).toBeGreaterThanOrEqual(0);
					expect(slot.y).toBeLessThanOrEqual(100);
				}
			}
		}
	});

	it("retains every legacy football formation key", () => {
		expect(sportDefinitions.football.formations.map((formation) => formation.key)).toEqual([
			"4-4-2", "4-3-3", "3-5-2", "4-2-3-1",
		]);
	});
});
