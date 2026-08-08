import { describe, expect, it } from "vitest";

import { socialGraphicTemplates } from "./templateRegistry";

describe("social graphic template registry", () => {
	it("registers the editorial result template at the reference dimensions", () => {
		const template = socialGraphicTemplates.find(
			(item) => item.id === "result-editorial-gold"
		);

		expect(template).toMatchObject({
			name: "Editorial result",
			width: 1365,
			height: 1651,
			supportedKinds: ["result"],
		});
	});

	it("registers one editorial template for every initial graphic type", () => {
		expect(socialGraphicTemplates).toEqual(expect.arrayContaining([
			expect.objectContaining({
				id: "upcoming-editorial-gold",
				width: 1365,
				height: 1651,
				supportedKinds: ["upcomingFixtures"],
			}),
			expect.objectContaining({
				id: "matchday-editorial-gold",
				width: 1365,
				height: 1365,
				supportedKinds: ["fixture"],
			}),
			expect.objectContaining({
				id: "result-editorial-gold",
				width: 1365,
				height: 1651,
				supportedKinds: ["result"],
			}),
		]));
	});

	it("makes the complete sponsor area optional", () => {
		socialGraphicTemplates.forEach((template) => {
			const sponsorToggle = template.fields?.find(
				(field) => field.id === "showSponsors"
			);

			expect(sponsorToggle).toEqual({
				id: "showSponsors",
				label: "Show sponsors area",
				type: "boolean",
				defaultValue: true,
			});
		});
	});
});
