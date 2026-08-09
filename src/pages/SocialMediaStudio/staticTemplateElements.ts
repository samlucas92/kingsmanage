import type { EditableTemplateBounds, EditableTemplateLayout } from "./templates/editableTemplateLayout";

export type StaticTemplateElement = EditableTemplateBounds & {
	id: string;
	label: string;
	minimumWidth: number;
	minimumHeight: number;
	resizeMode: "both";
};

const labelsByTemplate: Record<string, Record<string, string>> = {
	"matchday-editorial-gold": {
		"section-heading": "Competition heading",
		headline: "Matchday headline",
		"home-team": "Home team",
		versus: "Versus marker",
		"away-team": "Away team",
		"match-details": "Date, time and location",
		"sponsor-section": "Sponsor section",
	},
	"result-editorial-gold": {
		"section-heading": "Competition heading",
		headline: "Result headline",
		"club-crest": "Club crest",
		"score-panel": "Teams and score",
		"featured-area": "Featured player",
		"sponsor-section": "Sponsor section",
	},
	"lineup-editorial-gold": {
		"section-heading": "Competition heading",
		headline: "Lineup headline",
		"club-crest": "Club crest",
		"match-label": "Match label",
		pitch: "Pitch and starting lineup",
		substitutes: "Formation and substitutes",
		"sponsor-section": "Sponsor section",
	},
};

export function getStaticTemplateElements(
	templateId: string,
	definition: EditableTemplateLayout<string>,
	includeSponsors: boolean
): StaticTemplateElement[] {
	const labels = labelsByTemplate[templateId] ?? {};
	return Object.entries(definition.elements)
		.filter(([id]) => includeSponsors || id !== "sponsor-section")
		.map(([id, bounds]) => ({
			id,
			label: labels[id] ?? id,
			...bounds,
			minimumWidth: 48,
			minimumHeight: 32,
			resizeMode: "both" as const,
		}));
}

export function updateStaticTemplateElement<Definition extends EditableTemplateLayout<string>>(
	definition: Definition,
	elementId: string,
	bounds: EditableTemplateBounds
): Definition {
	if (!(elementId in definition.elements)) return definition;
	return {
		...definition,
		elements: {
			...definition.elements,
			[elementId]: bounds,
		},
	};
}

export function resetStaticTemplateElement<Definition extends EditableTemplateLayout<string>>(
	definition: Definition,
	defaults: Definition,
	elementId: string
): Definition {
	const original = defaults.elements[elementId];
	if (!original) return definition;
	return updateStaticTemplateElement(definition, elementId, { ...original });
}
