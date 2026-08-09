import { describe, expect, it, vi } from "vitest";

import { applyBrandTheme, createBrandTheme } from "./brandTheme";

describe("brand theme", () => {
	it("builds a complete palette from the club colours", () => {
		const theme = createBrandTheme("#336699", "#ffcc00");

		expect(theme["--color-yepset-500"]).toBe("#336699");
		expect(theme["--color-kick-400"]).toBe("#ffcc00");
		expect(theme["--color-yepset-950"]).toMatch(/^#[0-9a-f]{6}$/);
	});

	it("applies and removes the active club palette", () => {
		const target = {
			setProperty: vi.fn(),
			removeProperty: vi.fn(),
		};

		applyBrandTheme(target, { primaryColor: "#336699", secondaryColor: "#ffcc00" });
		expect(target.setProperty).toHaveBeenCalledWith("--color-yepset-500", "#336699");

		applyBrandTheme(target);
		expect(target.removeProperty).toHaveBeenCalledWith("--color-yepset-500");
	});
});
