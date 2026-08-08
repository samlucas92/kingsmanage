import type { MatchResult } from "../../stores/match";

export type SocialGraphicKind = "upcomingFixtures" | "fixture" | "result";

export type SocialGraphicAsset = {
	id: string;
	name: string;
	source: string;
};

export type SocialGraphicAssetSelection = {
	homeTeamLogo?: SocialGraphicAsset;
	awayTeamLogo?: SocialGraphicAsset;
	fixtureLogos: Array<SocialGraphicAsset | undefined>;
	featuredImage?: SocialGraphicAsset;
	sponsors: Array<SocialGraphicAsset | undefined>;
};

export type SocialGraphicTemplateField =
	| {
		id: string;
		label: string;
		type: "text";
		defaultValue: string;
		placeholder?: string;
	}
	| {
		id: string;
		label: string;
		type: "boolean";
		defaultValue: boolean;
	};

export type SocialFixture = {
	id: string;
	teamName: string;
	opponent: string;
	competition: string;
	date: string;
	venue: "home" | "away";
	location: string;
	result?: MatchResult;
};

export type SocialGraphicContent = {
	kind: SocialGraphicKind;
	clubName: string;
	clubHandle: string;
	headline: string;
	footer: string;
	fixtures: SocialFixture[];
	fields: Record<string, string | boolean>;
	assets: SocialGraphicAssetSelection;
};

export type SocialGraphicTemplateRenderContext = {
	canvas: HTMLCanvasElement;
	context: CanvasRenderingContext2D;
	width: number;
	height: number;
	content: SocialGraphicContent;
};

export type SocialGraphicTemplate = {
	id: string;
	name: string;
	description: string;
	width: number;
	height: number;
	supportedKinds: SocialGraphicKind[];
	fields?: SocialGraphicTemplateField[];
	render: (renderContext: SocialGraphicTemplateRenderContext) => void | Promise<void>;
};
