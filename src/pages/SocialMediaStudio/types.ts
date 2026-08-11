import type { MatchResult } from "../../stores/match";

export type SocialGraphicKind = "upcomingFixtures" | "fixture" | "lineup" | "result";

export type SocialGraphicAsset = {
	id: string;
	name: string;
	source: string;
};

export type SocialGraphicAssetSelection = {
	homeTeamLogo?: SocialGraphicAsset;
	awayTeamLogo?: SocialGraphicAsset;
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
	playerOfTheMatch: string;
	result?: MatchResult;
	scorers: SocialScorer[];
	oppositionScorers: SocialScorer[];
};

export type SocialFixtureOverride = Partial<
	Pick<
		SocialFixture,
		"teamName" | "opponent" | "competition" | "date" | "venue" | "location" | "playerOfTheMatch" | "oppositionScorers"
	>
> & {
	homeGoals?: number;
	awayGoals?: number;
};

export type SocialScorer = {
	playerId: string;
	name: string;
	goals: number;
};

export type SocialLineupPlayer = {
	playerId: string;
	name: string;
	number?: number;
	position: string;
	role: "starter" | "substitute";
	isCaptain?: boolean;
	x?: number;
	y?: number;
};

export type SocialLineup = {
	formationKey: string;
	formationName: string;
	players: SocialLineupPlayer[];
};

export type SocialGraphicContent = {
	kind: SocialGraphicKind;
	clubName: string;
	clubHandle: string;
	headline: string;
	footer: string;
	fixtures: SocialFixture[];
	lineup?: SocialLineup;
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
	resolveHeight?: (content: SocialGraphicContent) => number;
	supportedKinds: SocialGraphicKind[];
	fields?: SocialGraphicTemplateField[];
	render: (renderContext: SocialGraphicTemplateRenderContext) => void | Promise<void>;
};
