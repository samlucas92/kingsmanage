import { describe, expect, it } from "vitest";

import {
	deserializeRichText,
	ensureRichText,
	ensureRichTextWithLink,
	isRichText,
	isRichTextEmpty,
	richTextToPlainText,
	serializeRichText,
} from "./richText";

describe("rich text compatibility", () => {
	it("keeps existing plain text readable", () => {
		expect(richTextToPlainText("First line\nSecond line")).toBe(
			"First line\nSecond line"
		);
		expect(isRichText("First line")).toBe(false);
	});

	it("serializes structured content and extracts safe preview text", () => {
		const serialized = serializeRichText([
			{
				type: "heading-two",
				children: [{ text: "Matchday", bold: true }],
			},
			{
				type: "paragraph",
				children: [{ text: "Meet at 1pm" }],
			},
		]);

		expect(isRichText(serialized)).toBe(true);
		expect(richTextToPlainText(serialized)).toBe("Matchday\nMeet at 1pm");
		expect(deserializeRichText(serialized)).toHaveLength(2);
	});

	it("detects empty rich text and upgrades generated plain text", () => {
		expect(isRichTextEmpty(serializeRichText([
			{ type: "paragraph", children: [{ text: "" }] },
		]))).toBe(true);
		expect(isRichText(ensureRichText("Generated post"))).toBe(true);
	});

	it("turns a generated location name into a structured link", () => {
		const value = ensureRichTextWithLink(
			"Location: The Rec",
			"The Rec",
			"https://www.google.com/maps/search/?api=1&query=The%20Rec"
		);

		expect(value).toContain('"type":"link"');
		expect(value).toContain('"text":"The Rec"');
		expect(richTextToPlainText(value)).toBe("Location: The Rec");
	});
});
