import { describe, expect, it } from "vitest";

import { getSocialGraphicDimensions } from "./socialGraphicCanvas";
import { socialGraphicTemplates } from "./templateRegistry";
import type { SocialGraphicContent } from "./types";

const content: SocialGraphicContent = {
	kind: "result",
	clubName: "Kingsbridge Colts",
	clubHandle: "@kingsbridge",
	headline: "Full time",
	footer: "Come on, Kingsbridge!",
	fixtures: [],
	fields: { showSponsors: true },
	assets: { sponsors: [] },
};

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

	it("registers one editorial template for every graphic type", () => {
		expect(socialGraphicTemplates).toEqual(expect.arrayContaining([
			expect.objectContaining({
				id: "blank-editorial-gold",
				width: 1365,
				height: 1651,
				supportedKinds: ["blank"],
			}),
			expect.objectContaining({
				id: "player-portrait-club",
				width: 1254,
				height: 1254,
				supportedKinds: ["playerPortrait"],
			}),
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
				id: "lineup-editorial-gold",
				width: 1365,
				height: 1651,
				supportedKinds: ["lineup"],
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
		socialGraphicTemplates.filter((template) =>
			!["blank-editorial-gold", "player-portrait-club"].includes(template.id)
		).forEach((template) => {
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

	it("keeps the blank template empty until optional content is enabled", () => {
		const template = socialGraphicTemplates.find(
			(item) => item.id === "blank-editorial-gold"
		);

		expect(template?.fields).toEqual(expect.arrayContaining([
			expect.objectContaining({ id: "title", defaultValue: "" }),
			expect.objectContaining({ id: "showClubLogo", defaultValue: false }),
			expect.objectContaining({ id: "showFeaturedImage", defaultValue: false }),
			expect.objectContaining({ id: "showSponsors", defaultValue: false }),
		]));
		expect(getSocialGraphicDimensions(template!, {
			...content,
			kind: "blank",
			fields: { showSponsors: false },
		})).toEqual({ width: 1365, height: 1365 });
	});

	it.each([
		["result-editorial-gold", 1651, 1302],
		["upcoming-editorial-gold", 1651, 1330],
		["matchday-editorial-gold", 1365, 1122],
		["lineup-editorial-gold", 1651, 1400],
	])("crops only the sponsor strip from %s", (templateId, sponsorHeight, sponsorFreeHeight) => {
		const template = socialGraphicTemplates.find((item) => item.id === templateId);
		expect(template).toBeDefined();
		if (!template) return;

		expect(getSocialGraphicDimensions(template, content)).toEqual({
			width: 1365,
			height: sponsorHeight,
		});
		expect(getSocialGraphicDimensions(template, {
			...content,
			fields: { showSponsors: false },
		})).toEqual({
			width: 1365,
			height: sponsorFreeHeight,
		});
	});

	it("uses the shared sponsor wording for result graphics", () => {
		const resultTemplate = socialGraphicTemplates.find(
			(template) => template.id === "result-editorial-gold"
		);
		const sponsorsTitle = resultTemplate?.fields?.find(
			(field) => field.id === "sponsorsTitle"
		);

		expect(sponsorsTitle).toMatchObject({
			type: "text",
			defaultValue: "Proudly sponsored by",
		});
	});
});
