import { describe, expect, it } from "vitest";

import type { SocialGraphicAsset } from "../types";
import { getSponsorSlots } from "./sponsorLayout";

const sponsors: SocialGraphicAsset[] = [
	{ id: "one", name: "One", source: "/one.png" },
	{ id: "two", name: "Two", source: "/two.png" },
	{ id: "three", name: "Three", source: "/three.png" },
];

describe("sponsor layout", () => {
	it("uses the full sponsor area for one selected sponsor", () => {
		expect(getSponsorSlots([sponsors[0], undefined, undefined], 50, 1265, 40)).toEqual([
			{ asset: sponsors[0], x: 50, width: 1265 },
		]);
	});

	it("splits the sponsor area evenly between two selected sponsors", () => {
		expect(getSponsorSlots([sponsors[0], undefined, sponsors[1]], 50, 1265, 40)).toEqual([
			{ asset: sponsors[0], x: 50, width: 612.5 },
			{ asset: sponsors[1], x: 702.5, width: 612.5 },
		]);
	});

	it("keeps the three-column layout for three sponsors", () => {
		expect(getSponsorSlots(sponsors, 50, 1265, 40)).toEqual([
			{ asset: sponsors[0], x: 50, width: 395 },
			{ asset: sponsors[1], x: 485, width: 395 },
			{ asset: sponsors[2], x: 920, width: 395 },
		]);
	});

	it("shows the three placeholders when no sponsor has been selected", () => {
		expect(getSponsorSlots([], 50, 1265, 40)).toEqual([
			{ asset: undefined, x: 50, width: 395 },
			{ asset: undefined, x: 485, width: 395 },
			{ asset: undefined, x: 920, width: 395 },
		]);
	});
});
