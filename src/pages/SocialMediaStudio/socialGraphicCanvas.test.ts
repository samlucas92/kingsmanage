import { afterEach, describe, expect, it, vi } from "vitest";

import {
	canvasToPngBlob,
	getSocialExportDimensions,
	SOCIAL_EXPORT_MAX_HEIGHT,
	SOCIAL_EXPORT_MAX_WIDTH,
} from "./socialGraphicCanvas";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("social graphic exports", () => {
	it("uses the portrait dimensions required by the social platforms", () => {
		expect([SOCIAL_EXPORT_MAX_WIDTH, SOCIAL_EXPORT_MAX_HEIGHT]).toEqual([1080, 1350]);
	});

	it("resizes a template canvas without changing its aspect ratio", async () => {
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

		expect([exportCanvas.width, exportCanvas.height]).toEqual([1080, 1306]);
		expect(drawImage).toHaveBeenCalledWith(sourceCanvas, 0, 0, 1080, 1306);
	});

	it("keeps sponsor-free and square templates proportional", () => {
		expect(getSocialExportDimensions(1365, 1330)).toEqual({
			width: 1080,
			height: 1052,
		});
		expect(getSocialExportDimensions(1365, 1365)).toEqual({
			width: 1080,
			height: 1080,
		});
	});

	it("fits unusually tall templates inside the export boundary", () => {
		expect(getSocialExportDimensions(1365, 2000)).toEqual({
			width: 921,
			height: 1350,
		});
	});
});
