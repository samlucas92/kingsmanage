import { apiClient } from "./apiClient";
import type { LeagueRule, SaveLeagueRule } from "../types/leagueRules";

export const leagueRulesApi = {
	getAll: () => apiClient.get<LeagueRule[]>("/league-rules"),
	create: (rule: SaveLeagueRule) => apiClient.post<LeagueRule>("/league-rules", rule),
	update: (rule: LeagueRule) => apiClient.put<LeagueRule>(`/league-rules/${rule.id}`, rule),
};
