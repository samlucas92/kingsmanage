import { afterEach, describe, expect, it, vi } from "vitest";

import {
	canvasToPngBlob,
	SOCIAL_EXPORT_HEIGHT,
	SOCIAL_EXPORT_WIDTH,
} from "./socialGraphicCanvas";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("social graphic exports", () => {
	it("uses the portrait dimensions required by the social platforms", () => {
		expect([SOCIAL_EXPORT_WIDTH, SOCIAL_EXPORT_HEIGHT]).toEqual([1080, 1350]);
	});

	it("resizes a template canvas before encoding the PNG", async () => {
		const drawImage = vi.fn();
		const exportCanvas = {
			width: 0,
			height: 0,
			getContext: vi.fn(() => ({ drawImage })),
			toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(["png"], { type: "image/png" }))),
		};
		vi.stubGlobal("document", {
			createElement: vi.fn(() => exportCanvas),
		});
		const sourceCanvas = { width: 1365, height: 1651 } as HTMLCanvasElement;

		await canvasToPngBlob(sourceCanvas);

		expect([exportCanvas.width, exportCanvas.height]).toEqual([1080, 1350]);
		expect(drawImage).toHaveBeenCalledWith(sourceCanvas, 0, 0, 1080, 1350);
	});
});
