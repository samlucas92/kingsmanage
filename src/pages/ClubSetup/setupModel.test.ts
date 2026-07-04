import { describe, expect, it } from "vitest";

import type { AuthUser } from "../../types/auth";
import type { SportsClub } from "../../types/organization";
import type { ClubTeamProfile } from "../../stores/clubTeams";
import {
	buildSetupChecklist,
	getSuggestedTeamNames,
	isSetupComplete,
} from "./setupModel";

const club: SportsClub = {
	id: "club",
	organizationId: "organization",
	name: "Kingsbridge Colts",
	slug: "kingsbridge-colts",
	sportKey: "football",
	primaryColor: "#123456",
	secondaryColor: "#abcdef",
	contactEmail: "hello@example.com",
	contactPhone: "",
	websiteUrl: "",
	venues: [
		{
			id: "venue",
			name: "The Rec",
			address: "Kingsbridge",
			mapUrl: "",
			isDefault: true,
		},
	],
	setupStep: 4,
	setupCompletedAt: null,
	customFormations: [],
	logoFileId: null,
	isActive: true,
	createdAt: "",
	updatedAt: "",
};

const teams: ClubTeamProfile[] = [
	{
		id: "team",
		displayName: "First Team",
		shortName: "First",
		isActive: true,
		sortOrder: 0,
		competitions: ["League"],
	},
];

const admin: AuthUser = {
	id: "user",
	email: "admin@example.com",
	role: "Admin",
	tenantRole: "ClubAdmin",
	isPlatformAdmin: false,
	memberships: [],
	isActive: true,
};

describe("club setup", () => {
	it("recognises a complete essential setup", () => {
		const checklist = buildSetupChecklist(club, teams, admin);

		expect(checklist.every((item) => item.complete)).toBe(true);
		expect(isSetupComplete(checklist)).toBe(true);
	});

	it("requires a competition for every active team", () => {
		const checklist = buildSetupChecklist(
			club,
			[{ ...teams[0], competitions: [] }],
			admin
		);

		expect(
			checklist.find((item) => item.label === "Team competitions")?.complete
		).toBe(false);
	});

	it("provides sport-specific team names", () => {
		expect(getSuggestedTeamNames("rugby-union")).toEqual([
			"First XV",
			"Second XV",
		]);
		expect(getSuggestedTeamNames("cricket")).toEqual([
			"First XI",
			"Second XI",
		]);
	});

	it("handles legacy club records without setup fields", () => {
		const legacyClub = {
			id: club.id,
			organizationId: club.organizationId,
			name: club.name,
			slug: club.slug,
			sportKey: club.sportKey,
			customFormations: [],
			isActive: true,
			createdAt: "",
			updatedAt: "",
		} as unknown as SportsClub;

		expect(() => buildSetupChecklist(legacyClub, teams, admin)).not.toThrow();
		expect(buildSetupChecklist(legacyClub, teams, admin)[0].complete).toBe(false);
		expect(buildSetupChecklist(legacyClub, teams, admin)[1].complete).toBe(false);
	});
});
