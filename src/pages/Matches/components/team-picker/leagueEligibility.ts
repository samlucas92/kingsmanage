import type { MatchEligibility, PlayerLeagueEligibility } from "../../../../types/leagueRules";

export function resolvePlayerLeagueEligibility(playerId: string, eligibility: MatchEligibility | null, isSelected = false): PlayerLeagueEligibility {
	const result: PlayerLeagueEligibility = { isEligible: true, labels: [], reasons: [] };
	for (const rule of eligibility?.rules ?? []) {
		if (rule.isExempt || !rule.affectedPlayerIds.includes(playerId)) continue;
		if (rule.ruleType === "CupTied") {
			result.isEligible = false;
			result.labels.push("Cup-tied");
			result.reasons.push(`${rule.name}: this player has played in a qualifying higher-team cup match.`);
			result.marker = "CUP";
			result.tone = "danger";
			continue;
		}
		const max = rule.maxPlayers ?? 0;
		result.marker = `${rule.selectedCount}/${max}`;
		if (isSelected && rule.selectedCount > max) {
			result.isEligible = false;
			result.labels.push(`Over limit ${rule.selectedCount}/${max}`);
			result.reasons.push(`${rule.name}: ${rule.selectedCount} affected players are selected, exceeding the limit of ${max}.`);
			result.tone = "danger";
		} else if (!isSelected && rule.selectedCount >= max) {
			result.isEligible = false;
			result.labels.push("Limit reached");
			result.reasons.push(`${rule.name}: ${rule.selectedCount}/${max} affected players are already selected.`);
			result.tone = "danger";
		} else {
			result.labels.push(`Counts ${rule.selectedCount}/${max}`);
			result.reasons.push(`${rule.name}: this player counts towards the ${max}-player limit.`);
			result.tone = "warning";
		}
	}
	return result;
}
