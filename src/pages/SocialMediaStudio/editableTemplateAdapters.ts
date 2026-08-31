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
	createPlayerPortraitTemplate,
	parsePlayerPortraitDefinition,
	playerPortraitDefaultDefinition,
	playerPortraitDefaultSource,
	serializePlayerPortraitDefinition,
} from "./templates/playerPortraitTemplate";
import type { PlayerPortraitTemplateDefinition } from "./templates/playerPortraitTemplate";
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
	| PlayerPortraitTemplateDefinition
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
		id: "player-portrait-club",
		defaultDefinition: playerPortraitDefaultDefinition,
		defaultSource: playerPortraitDefaultSource,
		parse: parsePlayerPortraitDefinition,
		serialize: (definition) => serializePlayerPortraitDefinition(
			definition as PlayerPortraitTemplateDefinition
		),
		create: (definition) => createPlayerPortraitTemplate(
			definition as PlayerPortraitTemplateDefinition
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
