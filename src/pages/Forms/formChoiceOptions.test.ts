import { describe, expect, it } from "vitest";

import type { ClubFormQuestion } from "../../types/forms";
import {
	isChoiceOptionSelected,
	optionRequiresTextInput,
	removeStructuredChoiceOption,
} from "./formChoiceOptions";

const generatedQuestion: ClubFormQuestion = {
	id: "question-1",
	prompt: "Dick of the day",
	type: "SingleChoice",
	isRequired: true,
	optionSource: "MatchPlayers",
	options: ["Alex Smith", "Other"],
	choiceOptions: [
		{ value: "player-1", label: "Alex Smith", playerId: "player-1" },
		{ value: "Other", label: "Other", requiresTextInput: true, textInputLabel: "Who was it?" },
	],
	minRating: 1,
	maxRating: 5,
};

describe("form choice options", () => {
	it("recognises generated Other selections and requires the follow-up input", () => {
		const other = generatedQuestion.choiceOptions?.[1];
		expect(other).toBeDefined();
		if (!other) return;

		expect(isChoiceOptionSelected(other, ["other"])).toBe(true);
		expect(optionRequiresTextInput(other)).toBe(true);
		expect(optionRequiresTextInput({ value: "Other", label: "Other" })).toBe(true);
	});

	it("removes Other from both the ordered labels and structured metadata", () => {
		const updated = removeStructuredChoiceOption(generatedQuestion, "Other");

		expect(updated.options).toEqual(["Alex Smith"]);
		expect(updated.choiceOptions).toEqual([
			{ value: "player-1", label: "Alex Smith", playerId: "player-1" },
		]);
		expect(updated.optionSource).toBe("MatchPlayers");
	});
});
