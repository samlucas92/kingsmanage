import type { ClubFormQuestion, ClubFormQuestionOption } from "../../types/forms";

export function optionRequiresTextInput(option: ClubFormQuestionOption) {
	return option.requiresTextInput || isOtherOption(option.value, option.label);
}

export function isChoiceOptionSelected(
	option: ClubFormQuestionOption,
	selectedOptions: string[]
) {
	const selectedValues = new Set(selectedOptions.map((value) => value.trim().toLowerCase()));
	return selectedValues.has(option.value.trim().toLowerCase())
		|| selectedValues.has(option.label.trim().toLowerCase());
}

export function removeStructuredChoiceOption(
	question: ClubFormQuestion,
	value: string
): ClubFormQuestion {
	const removedOption = (question.choiceOptions ?? []).find((option) =>
		option.value.toLowerCase() === value.toLowerCase()
		|| option.label.toLowerCase() === value.toLowerCase()
	);
	const choiceOptions = (question.choiceOptions ?? []).filter((option) =>
		option !== removedOption
	);
	const hasPlayers = choiceOptions.some((option) => option.playerId);
	const removedLabels = new Set([
		value,
		removedOption?.value ?? "",
		removedOption?.label ?? "",
	].map((label) => label.toLowerCase()));

	return {
		...question,
		optionSource: hasPlayers ? question.optionSource ?? "MatchPlayers" : "Manual",
		choiceOptions,
		options: question.options.filter((option) => !removedLabels.has(option.toLowerCase())),
	};
}

function isOtherOption(value?: string | null, label?: string | null) {
	return value?.trim().toLowerCase() === "other" || label?.trim().toLowerCase() === "other";
}
