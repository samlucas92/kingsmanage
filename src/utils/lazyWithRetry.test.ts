import { describe, expect, it } from "vitest";
import { isChunkLoadError } from "./lazyWithRetry";

describe("isChunkLoadError", () => {
	it.each([
		"Failed to fetch dynamically imported module: /assets/page.js",
		"ChunkLoadError: Loading chunk 42 failed",
		"Importing a module script failed",
	])("recognises recoverable deployment errors", (message) => {
		expect(isChunkLoadError(new TypeError(message))).toBe(true);
	});

	it("does not hide ordinary application errors", () => {
		expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
	});
});
