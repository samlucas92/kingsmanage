import { describe, expect, it } from "vitest";

import type { Match } from "../stores/match";
import { deserializeRichText, serializeRichText } from "./richText";
import { applyPostTemplate, buildGeneratedRichPostBody, buildTemplateValues, shuffleNames } from "./postTemplate";

describe("post templates", () => {
	it("shuffles a squad without dropping names", () => {
		const result = shuffleNames(["A", "B", "C"], () => 0);
		expect(result).toEqual(["B", "C", "A"]);
		expect(result).toHaveLength(3);
	});

	it("replaces fixture placeholders and does not expose lineup order labels", () => {
		const match = {
			id: "match-1",
			team: "team-1",
			opponent: "Rovers",
			competition: "League",
			date: "2026-06-28T14:00:00.000Z",
			venue: "away",
			location: "The Rec",
			state: "upcoming",
			isCompleted: false,
			isLineupLocked: true,
			selectedFormation: "4-3-3",
			postponements: [],
			selectedPlayers: [
				{ playerId: "p1", area: "pitch" },
				{ playerId: "p2", area: "bench" },
			],
		} as Match;
		const values = buildTemplateValues(
			match,
			[
				{ id: "p1", name: "Alice", positions: [], appearances: 0, number: 1, isActive: true },
				{ id: "p2", name: "Bob", positions: [], appearances: 0, number: 2, isActive: true },
			],
			"First Team",
			() => 0
		);
		const generated = applyPostTemplate({
			id: "template-1",
			name: "Matchday",
			titleTemplate: "{{team}} vs {{opponent}}",
			bodyTemplate: "{{competition}}\n{{location}}\n{{squad}}\n{{directions}}",
			isPinned: false,
			createdAt: "",
			updatedAt: "",
		}, values);

		expect(generated.title).toBe("First Team vs Rovers");
		expect(generated.body).toContain("Alice");
		expect(generated.body).toContain("Bob");
		expect(generated.body).toContain("League");
		expect(generated.body).toContain("The Rec");
		expect(generated.body).toContain("Directions");
		expect(values.directionsUrl).toContain("google.com/maps");
		expect(generated.body).not.toMatch(/starter|bench/i);

		const richBody = buildGeneratedRichPostBody(generated.body, values);
		expect(richBody.match(/"type":"link"/g)).toHaveLength(2);
		expect(richBody).toContain('"text":"The Rec"');
		expect(richBody).toContain('"text":"Directions"');
	});

	it("turns generated squad bullet text into semantic rich text list items", () => {
		const values = {
			team: "First Team",
			opponent: "Rovers",
			date: "18/07/2026, 13:00:00",
			venue: "Home",
			location: "Penyrheol 3G",
			locationUrl: "",
			squad: "• Alice\n• Bob\n• Charlie",
			directions: "Directions to follow",
			directionsUrl: "",
			competition: "Friendly",
		};

		const richTemplate = serializeRichText([
			{
				type: "paragraph",
				children: [{ text: "Squad:\n{{squad}}" }],
			},
		]);

		const generated = applyPostTemplate({
			id: "template-1",
			name: "Matchday",
			titleTemplate: "{{team}} vs {{opponent}}",
			bodyTemplate: richTemplate,
			isPinned: false,
			createdAt: "",
			updatedAt: "",
		}, values);

		const body = buildGeneratedRichPostBody(generated.body, values);
		const nodes = deserializeRichText(body);

		expect(nodes).toMatchObject([
			{
				type: "paragraph",
				children: [{ text: "Squad:" }],
			},
			{
				type: "bulleted-list",
				children: [
					{ type: "list-item", children: [{ text: "Alice" }] },
					{ type: "list-item", children: [{ text: "Bob" }] },
					{ type: "list-item", children: [{ text: "Charlie" }] },
				],
			},
		]);
	});
});
