import { describe, expect, it } from "vitest";

import type { ClubFormResults } from "../../types/forms";
import { buildFormResultsGraphicData, getFormResultsImageFilename } from "./formResultsImage";

const results: ClubFormResults = {
	formId: "form-1",
	title: "Match awards",
	submissionCount: 12,
	questions: [{
		questionId: "motm",
		prompt: "Man of the Match",
		type: "SingleChoice",
		responseCount: 12,
		options: [
			{ value: "alex", label: "Alex Wilson", count: 3 },
			{ value: "sam", label: "Sam Jones", count: 7 },
			{ value: "ben", label: "Ben Price", count: 2 },
		],
		textResponses: [],
	}],
};

describe("form results image", () => {
	it("ranks vote options and identifies the winner", () => {
		const graphic = buildFormResultsGraphicData(results);

		expect(graphic.questions[0].rankedOptions.map((option) => option.label)).toEqual([
			"Sam Jones",
			"Alex Wilson",
			"Ben Price",
		]);
		expect(graphic.questions[0].winners.map((option) => option.label)).toEqual(["Sam Jones"]);
	});

	it("keeps tied winners visible", () => {
		const tiedResults: ClubFormResults = {
			...results,
			questions: [{
				...results.questions[0],
				options: [
					{ value: "alex", label: "Alex Wilson", count: 6 },
					{ value: "sam", label: "Sam Jones", count: 6 },
				],
			}],
		};

		expect(buildFormResultsGraphicData(tiedResults).questions[0].winners).toHaveLength(2);
	});

	it("creates a safe PNG filename", () => {
		expect(getFormResultsImageFilename("Kingsbridge Colts FC", "Man of the Match")).toBe(
			"kingsbridge-colts-fc-man-of-the-match-results.png"
		);
	});
});
