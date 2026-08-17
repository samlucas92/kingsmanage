import { describe, expect, it } from "vitest";
import { omitBlankId } from "./apiPayload";

describe("omitBlankId", () => {
	it("omits an empty create-time id", () => {
		expect(omitBlankId({ id: "", name: "Club Secretary" })).toEqual({
			name: "Club Secretary",
		});
	});

	it("preserves an existing entity id", () => {
		expect(omitBlankId({ id: "6b98c4d2-588c-46bd-b724-3b91b8c8745e", name: "Treasurer" })).toEqual({
			id: "6b98c4d2-588c-46bd-b724-3b91b8c8745e",
			name: "Treasurer",
		});
	});
});
