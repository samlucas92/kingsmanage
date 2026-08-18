import type { SocialGraphicTemplate } from "./types";
import {
	blankEditorialDefaultDefinition,
	blankEditorialDefaultSource,
	createBlankEditorialTemplate,
	parseBlankEditorialDefinition,
	serializeBlankEditorialDefinition,
} from "./templates/blankEditorialTemplate";
import type { BlankEditorialTemplateDefinition } from "./templates/blankEditorialTemplate";
import {
	createLineupEditorialTemplate,
	lineupEditorialDefaultDefinition,
	lineupEditorialDefaultSource,
	parseLineupEditorialDefinition,
	serializeLineupEditorialDefinition,
} from "./templates/lineupEditorialTemplate";
import type { LineupEditorialTemplateDefinition } from "./templates/lineupEditorialTemplate";
import {
	createMatchdayEditorialTemplate,
	matchdayEditorialDefaultDefinition,
	matchdayEditorialDefaultSource,
	parseMatchdayEditorialDefinition,
	serializeMatchdayEditorialDefinition,
} from "./templates/matchdayEditorialTemplate";
import type { MatchdayEditorialTemplateDefinition } from "./templates/matchdayEditorialTemplate";
import {
	createResultEditorialTemplate,
	parseResultEditorialDefinition,
	resultEditorialDefaultDefinition,
	resultEditorialDefaultSource,
	serializeResultEditorialDefinition,
} from "./templates/resultEditorialTemplate";
import type { ResultEditorialTemplateDefinition } from "./templates/resultEditorialTemplate";

export type StaticEditableTemplateDefinition =
	| BlankEditorialTemplateDefinition
	| MatchdayEditorialTemplateDefinition
	| ResultEditorialTemplateDefinition
	| LineupEditorialTemplateDefinition;

export type StaticEditableTemplateAdapter = {
	id: string;
	defaultDefinition: StaticEditableTemplateDefinition;
	defaultSource: string;
	parse: (source: string) => StaticEditableTemplateDefinition;
	serialize: (definition: StaticEditableTemplateDefinition) => string;
	create: (definition: StaticEditableTemplateDefinition) => SocialGraphicTemplate;
};

export const staticEditableTemplateAdapters: StaticEditableTemplateAdapter[] = [
	{
		id: "blank-editorial-gold",
		defaultDefinition: blankEditorialDefaultDefinition,
		defaultSource: blankEditorialDefaultSource,
		parse: parseBlankEditorialDefinition,
		serialize: (definition) => serializeBlankEditorialDefinition(
			definition as BlankEditorialTemplateDefinition
		),
		create: (definition) => createBlankEditorialTemplate(
			definition as BlankEditorialTemplateDefinition
		),
	},
	{
		id: "matchday-editorial-gold",
		defaultDefinition: matchdayEditorialDefaultDefinition,
		defaultSource: matchdayEditorialDefaultSource,
		parse: parseMatchdayEditorialDefinition,
		serialize: (definition) => serializeMatchdayEditorialDefinition(
			definition as MatchdayEditorialTemplateDefinition
		),
		create: (definition) => createMatchdayEditorialTemplate(
			definition as MatchdayEditorialTemplateDefinition
		),
	},
	{
		id: "lineup-editorial-gold",
		defaultDefinition: lineupEditorialDefaultDefinition,
		defaultSource: lineupEditorialDefaultSource,
		parse: parseLineupEditorialDefinition,
		serialize: (definition) => serializeLineupEditorialDefinition(
			definition as LineupEditorialTemplateDefinition
		),
		create: (definition) => createLineupEditorialTemplate(
			definition as LineupEditorialTemplateDefinition
		),
	},
	{
		id: "result-editorial-gold",
		defaultDefinition: resultEditorialDefaultDefinition,
		defaultSource: resultEditorialDefaultSource,
		parse: parseResultEditorialDefinition,
		serialize: (definition) => serializeResultEditorialDefinition(
			definition as ResultEditorialTemplateDefinition
		),
		create: (definition) => createResultEditorialTemplate(
			definition as ResultEditorialTemplateDefinition
		),
	},
];

export const staticEditableTemplateAdaptersById = Object.fromEntries(
	staticEditableTemplateAdapters.map((adapter) => [adapter.id, adapter])
);
