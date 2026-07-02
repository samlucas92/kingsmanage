import { describe, expect, it } from "vitest";
import {
	getClubSportDefinition,
	getSportDefinition,
	sportDefinitions,
} from "./sports";

describe("sport definitions", () => {
	it("contains the initial supported sports", () => {
		expect(Object.keys(sportDefinitions)).toEqual(
			expect.arrayContaining(["football", "rugby-union", "rugby-league", "cricket", "hockey", "netball"])
		);
	});

	it.each([
		["football", 11],
		["rugby-union", 15],
		["rugby-league", 13],
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

	it("adds club formations without allowing them to replace built-in layouts", () => {
		const customFormation = {
			key: "narrow-diamond",
			name: "Narrow diamond",
			slots: sportDefinitions.football.formations[0].slots,
		};
		const duplicateBuiltIn = {
			...customFormation,
			key: "4-4-2",
			name: "Replacement",
		};

		const sport = getClubSportDefinition("football", [
			customFormation,
			duplicateBuiltIn,
		]);

		expect(sport.formations.at(-1)?.key).toBe("narrow-diamond");
		expect(
			sport.formations.find((formation) => formation.key === "4-4-2")?.name
		).toBe("4-4-2");
	});
});
