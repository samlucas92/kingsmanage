import { describe, expect, it } from "vitest";

import {
	getCopiedPostPlainText,
	sanitizeCopiedPostHtml,
} from "./clipboardHtml";

describe("clipboard html", () => {
	it("strips application-only attributes from copied post markup", () => {
		const html = sanitizeCopiedPostHtml(
			[
				'<div class="space-y-2">',
				'<p class="text-base" data-testid="body">Squad:</p>',
				'<ul class="list-disc pl-6">',
				'<li class="pl-1">Alice</li>',
				'<li class="pl-1">Bob</li>',
				"</ul>",
				'<p><a class="font-semibold" href="https://example.com" target="_blank" rel="noreferrer">Directions</a></p>',
				"</div>",
			].join("")
		);

		expect(html).toBe(
			'<p>Squad:</p><ul><li>Alice</li><li>Bob</li></ul><p><a href="https://example.com">Directions</a></p>'
		);
	});

	it("drops non-http link URLs from copied post markup", () => {
		const html = sanitizeCopiedPostHtml(
			'<p><a href="javascript:alert(1)" class="font-semibold">Bad link</a></p>'
		);

		expect(html).toBe("<p><a>Bad link</a></p>");
	});

	it("includes hrefs in plain text when destination apps ignore html", () => {
		const text = getCopiedPostPlainText(
			[
				"<p>Squad:</p>",
				"<ul>",
				"<li>Alice</li>",
				"<li>Bob</li>",
				"</ul>",
				'<p><a href="https://example.com/directions">Directions</a></p>',
			].join("")
		);

		expect(text).toBe(
			"Squad:\n\n- Alice\n- Bob\n\nDirections (https://example.com/directions)"
		);
	});
});
