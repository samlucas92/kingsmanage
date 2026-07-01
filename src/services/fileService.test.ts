import { describe, expect, it } from "vitest";

import { calculateFileHash } from "./fileService";

describe("file content hashing", () => {
	it("returns a stable SHA-256 hash for identical content", async () => {
		const first = await calculateFileHash(new Blob(["same file"]));
		const second = await calculateFileHash(new Blob(["same file"]));

		expect(first).toBe(second);
		expect(first).toMatch(/^[a-f0-9]{64}$/);
	});

	it("returns different hashes for different content", async () => {
		const first = await calculateFileHash(new Blob(["first"]));
		const second = await calculateFileHash(new Blob(["second"]));

		expect(first).not.toBe(second);
	});
});
