import type { ClubTeam, MatchState } from "../../../stores/match";

export type MatchFilter = "all" | "upcoming" | "completed" | "postponed";
export type MatchTeamFilter = "all" | ClubTeam;

export function getMatchFilterFromState(
	state: MatchState,
	isCompleted: boolean
): MatchFilter {
	if (state === "postponed") return "postponed";
	if (isCompleted) return "completed";
	return "upcoming";
}
