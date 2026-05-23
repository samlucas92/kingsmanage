import type { Season } from "../stores/seasons";

export const DEFAULT_SEASON_ID = "2025-2026";

export const seedSeasons: Season[] = [
	{
		id: DEFAULT_SEASON_ID,
		name: "2025-2026",
		startDate: "2025-07-01",
		endDate: "2026-06-30",
		isActive: true,
	},
];