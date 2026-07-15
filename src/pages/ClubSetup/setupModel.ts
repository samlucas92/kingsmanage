import type { AuthUser } from "../../types/auth";
import type { SportsClub } from "../../types/organization";
import type { ClubTeamProfile } from "../../stores/clubTeams";

export const setupSteps = [
	"Club identity",
	"Venues",
	"Teams",
	"Finance",
	"Staff access",
	"Review",
] as const;

export type SetupCheck = {
	label: string;
	complete: boolean;
};

const teamNamesBySport: Record<string, [string, string]> = {
	football: ["First Team", "Second Team"],
	"rugby-union": ["First XV", "Second XV"],
	"rugby-league": ["First XIII", "Reserve XIII"],
	cricket: ["First XI", "Second XI"],
	hockey: ["First Team", "Second Team"],
	netball: ["A Team", "B Team"],
};

export function getSuggestedTeamNames(sportKey: string) {
	return teamNamesBySport[sportKey] ?? teamNamesBySport.football;
}

export function buildSetupChecklist(
	club: SportsClub,
	teams: ClubTeamProfile[],
	currentUser: AuthUser | null
): SetupCheck[] {
	const activeTeams = teams.filter((team) => team.isActive);
	const hasStaffAccess =
		currentUser?.tenantRole === "OrganizationAdmin" ||
		currentUser?.tenantRole === "ClubAdmin";

	return [
		{
			label: "Club identity and contact details",
			complete: Boolean(
				safeTrim(club.name) &&
					safeTrim(club.sportKey) &&
					safeTrim(club.contactEmail) &&
					safeTrim(club.primaryColor) &&
					safeTrim(club.secondaryColor)
			),
		},
		{
			label: "At least one default venue",
			complete: (club.venues ?? []).some(
				(venue) =>
					venue?.isDefault &&
					safeTrim(venue.name) &&
					safeTrim(venue.address)
			),
		},
		{
			label: "Active teams",
			complete: activeTeams.length > 0,
		},
		{
			label: "Team competitions",
			complete:
				activeTeams.length > 0 &&
				activeTeams.every((team) =>
					(team.competitions ?? []).some((competition) =>
						Boolean(safeTrim(competition))
					)
				),
		},
		{
			label: "An administrator can manage the club",
			complete: hasStaffAccess,
		},
	];
}

function safeTrim(value?: string | null) {
	return typeof value === "string" ? value.trim() : "";
}

export function isSetupComplete(checklist: SetupCheck[]) {
	return checklist.every((item) => item.complete);
}
