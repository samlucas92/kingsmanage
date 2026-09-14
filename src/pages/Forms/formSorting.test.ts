import { describe, expect, it } from "vitest";

import type { ClubForm, ClubFormStatus } from "../../types/forms";
import { sortFormsActiveFirst } from "./formSorting";

describe("form sorting", () => {
	it("puts open and draft forms before closed forms", () => {
		const forms = [
			form("closed-1", "Closed"),
			form("open-1", "Open"),
			form("draft-1", "Draft"),
			form("closed-2", "Closed"),
			form("open-2", "Open"),
		];

		expect(sortFormsActiveFirst(forms).map((item) => item.id)).toEqual([
			"open-1",
			"open-2",
			"draft-1",
			"closed-1",
			"closed-2",
		]);
	});

	it("does not mutate the loaded form order", () => {
		const forms = [form("closed", "Closed"), form("open", "Open")];

		sortFormsActiveFirst(forms);

		expect(forms.map((item) => item.id)).toEqual(["closed", "open"]);
	});
});

function form(id: string, status: ClubFormStatus): ClubForm {
	return {
		id,
		goCode: id,
		title: id,
		description: "",
		status,
		formType: "Custom",
		sourceType: "General",
		sourceMatchLabel: "",
		createdByUserEmail: "admin@example.com",
		allowAnonymousResponses: true,
		allowMultipleSubmissions: false,
		questions: [],
		hasSubmitted: false,
		submissionCount: 0,
		createdAt: "2026-09-14T12:00:00Z",
		updatedAt: "2026-09-14T12:00:00Z",
	};
}
