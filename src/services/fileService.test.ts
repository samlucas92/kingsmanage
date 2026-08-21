import { afterEach, describe, expect, it, vi } from "vitest";

const filesApiMocks = vi.hoisted(() => ({
	createUploadUrl: vi.fn(),
	markUploaded: vi.fn(),
	uploadContent: vi.fn(),
}));

vi.mock("./filesApi", () => ({
	filesApi: filesApiMocks,
}));

import { calculateFileHash, uploadLinkedFile } from "./fileService";

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	Object.values(filesApiMocks).forEach((mock) => mock.mockReset());
});

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

describe("linked file uploads", () => {
	it("marks a successful direct R2 upload as uploaded", async () => {
		const file = testFile();
		const uploaded = { id: "file-id", status: "Uploaded" };
		filesApiMocks.createUploadUrl.mockResolvedValue(uploadSession());
		filesApiMocks.markUploaded.mockResolvedValue(uploaded);
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

		const result = await uploadLinkedFile({
			file,
			linkedEntityType: "SocialPublication",
			linkedEntityId: "publication-id",
		});

		expect(result).toBe(uploaded);
		expect(filesApiMocks.markUploaded).toHaveBeenCalledWith("file-id");
		expect(filesApiMocks.uploadContent).not.toHaveBeenCalled();
	});

	it("uses the authenticated API proxy when browser CORS blocks R2", async () => {
		const file = testFile();
		const uploaded = { id: "file-id", status: "Uploaded" };
		filesApiMocks.createUploadUrl.mockResolvedValue(uploadSession());
		filesApiMocks.uploadContent.mockResolvedValue(uploaded);
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

		const result = await uploadLinkedFile({
			file,
			linkedEntityType: "SocialPublication",
			linkedEntityId: "publication-id",
		});

		expect(result).toBe(uploaded);
		expect(filesApiMocks.uploadContent).toHaveBeenCalledWith("file-id", file, "image/jpeg");
		expect(filesApiMocks.markUploaded).not.toHaveBeenCalled();
	});
});

function testFile() {
	return new File(["social artwork"], "social-post.jpg", { type: "image/jpeg" });
}

function uploadSession() {
	return {
		file: { id: "file-id" },
		uploadUrl: "https://storage.example/upload",
		uploadRequired: true,
	};
}
