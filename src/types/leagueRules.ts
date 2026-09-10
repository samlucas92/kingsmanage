export type LeagueRuleType = "RecentHigherTeamAppearanceLimit" | "CupTied";

export type LeagueRule = {
	id: string;
	name: string;
	isActive: boolean;
	ruleType: LeagueRuleType;
	higherTeamId: string;
	restrictedTeamId: string;
	maxPlayers?: number | null;
	exemptWhenHigherTeamPlaysSameDay: boolean;
	higherTeamCompetitions: string[];
	restrictedTeamCompetitions: string[];
	createdAt?: string;
	updatedAt?: string;
};

export type SaveLeagueRule = Omit<LeagueRule, "id" | "createdAt" | "updatedAt">;

export type LeagueRuleEvaluation = {
	ruleId: string;
	name: string;
	ruleType: LeagueRuleType;
	isExempt: boolean;
	maxPlayers?: number | null;
	selectedCount: number;
	affectedPlayerIds: string[];
	summary: string;
};

export type MatchEligibility = {
	isValid: boolean;
	violations: string[];
	rules: LeagueRuleEvaluation[];
};

export type PlayerLeagueEligibility = {
	isEligible: boolean;
	labels: string[];
	reasons: string[];
};
