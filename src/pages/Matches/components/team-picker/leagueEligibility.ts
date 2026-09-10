import type { MatchEligibility, PlayerLeagueEligibility } from "../../../../types/leagueRules";

export function resolvePlayerLeagueEligibility(playerId: string, eligibility: MatchEligibility | null): PlayerLeagueEligibility {
	const result: PlayerLeagueEligibility = { isEligible: true, labels: [], reasons: [] };
	for (const rule of eligibility?.rules ?? []) {
		if (rule.isExempt || !rule.affectedPlayerIds.includes(playerId)) continue;
		if (rule.ruleType === "CupTied") {
			result.isEligible = false;
			result.labels.push("Cup-tied");
			result.reasons.push(`${rule.name}: this player has played in a qualifying higher-team cup match.`);
			continue;
		}
		const max = rule.maxPlayers ?? 0;
		if (rule.selectedCount >= max) {
			result.isEligible = false;
			result.labels.push("Limit reached");
			result.reasons.push(`${rule.name}: ${rule.selectedCount}/${max} affected players are already selected.`);
		} else {
			result.labels.push(`Counts ${rule.selectedCount}/${max}`);
			result.reasons.push(`${rule.name}: this player counts towards the ${max}-player limit.`);
		}
	}
	return result;
}
