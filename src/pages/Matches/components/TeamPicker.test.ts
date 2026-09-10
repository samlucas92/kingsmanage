import { describe, expect, it } from "vitest";
import { resolvePlayerLeagueEligibility } from "./team-picker/leagueEligibility";
import type { MatchEligibility } from "../../../types/leagueRules";

const eligibility: MatchEligibility = {
	isValid: true,
	violations: [],
	rules: [{
		ruleId: "rule-1",
		name: "Second-team limit",
		ruleType: "RecentHigherTeamAppearanceLimit",
		isExempt: false,
		maxPlayers: 3,
		selectedCount: 3,
		affectedPlayerIds: ["limited"],
		summary: "3/3 selected",
	}, {
		ruleId: "rule-2",
		name: "League Cup tie",
		ruleType: "CupTied",
		isExempt: false,
		selectedCount: 0,
		affectedPlayerIds: ["cup-tied"],
		summary: "One player cup-tied",
	}],
};

describe("league-rule player eligibility", () => {
	it("blocks a previous first-team player after the configured limit is reached", () => {
		const result = resolvePlayerLeagueEligibility("limited", eligibility);
		expect(result.isEligible).toBe(false);
		expect(result.labels).toContain("Limit reached");
	});

	it("blocks a cup-tied player and leaves unrelated players selectable", () => {
		expect(resolvePlayerLeagueEligibility("cup-tied", eligibility).labels).toContain("Cup-tied");
		expect(resolvePlayerLeagueEligibility("unrelated", eligibility).isEligible).toBe(true);
	});

	it("marks selected affected players and identifies an over-limit lineup", () => {
		const overLimit: MatchEligibility = {
			...eligibility,
			isValid: false,
			rules: [{ ...eligibility.rules[0], selectedCount: 4, affectedPlayerIds: ["selected"] }],
		};

		const result = resolvePlayerLeagueEligibility("selected", overLimit, true);

		expect(result.isEligible).toBe(false);
		expect(result.marker).toBe("4/3");
		expect(result.tone).toBe("danger");
	});
});
