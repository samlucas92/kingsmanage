import type { UserRole } from "../../types/auth";

export type DashboardTab = "overview" | "matches" | "finance" | "events" | "posts";

export type DashboardTabDefinition = {
	id: DashboardTab;
	label: string;
	description: string;
	isFuture?: boolean;
	roles: UserRole[];
};

export const dashboardTabs: DashboardTabDefinition[] = [
	{
		id: "overview",
		label: "Overview",
		description: "Season health, quick actions, and areas needing attention.",
		roles: ["Admin", "Coach", "Player"],
	},
	{
		id: "matches",
		label: "Matches",
		description: "Upcoming fixtures, recent results, and match actions.",
		roles: ["Admin", "Coach"],
	},
	{
		id: "finance",
		label: "Finance",
		description: "Outstanding balances and payment attention list.",
		roles: ["Admin"],
	},
	{
		id: "events",
		label: "Events",
		description: "Fixtures, training, socials, meetings, and availability tracking.",
		roles: ["Admin", "Coach", "Player"],
	},
	{
		id: "posts",
		label: "Posts",
		description: "Club updates, reminders, and player-facing announcements.",
		roles: ["Admin", "Coach", "Player"],
	},
];

export function getDashboardTabFromSearch(value: string | null): DashboardTab | null {
	if (
		value === "overview" ||
		value === "matches" ||
		value === "finance" ||
		value === "events" ||
		value === "posts"
	) {
		return value;
	}

	return null;
}
