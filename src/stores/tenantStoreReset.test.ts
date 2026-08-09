import { describe, expect, it } from "vitest";

import { useClubTeamStore } from "./clubTeams";
import { useEventStore } from "./events";
import { useFinanceStore } from "./finance";
import { useHistoricalStatsStore } from "./historicalStats";
import { useMatchStore } from "./match";
import { useMessageStore } from "./messages";
import { useNotificationStore } from "./notifications";
import { usePlayerStore, type Player } from "./players";
import { usePostStore } from "./posts";
import { useSeasonStore } from "./seasons";
import { useStatsStore } from "./stats";
import { resetTenantStores } from "./tenantStoreReset";
import { useUserStore } from "./users";

const previousPlayer: Player = {
	id: "previous-player",
	name: "Previous Player",
	positions: ["CB"],
	appearances: 1,
	number: 4,
	isActive: true,
};

describe("resetTenantStores", () => {
	it("clears every tenant-scoped store and preserves its actions", () => {
		usePlayerStore.setState({ players: [previousPlayer], hasLoadedPlayers: true });
		useMatchStore.setState({ matches: [{ id: "previous-match" } as never], hasLoadedMatches: true });
		useSeasonStore.setState({ seasons: [{ id: "previous-season" } as never], hasLoadedSeasons: true });
		useFinanceStore.setState({ playerFinanceRecords: [{ playerId: "previous-player" } as never], hasLoadedFinance: true });
		useStatsStore.setState({ seasonStats: [{ playerId: "previous-player" } as never], hasLoadedStats: true });
		useHistoricalStatsStore.setState({ historicalPlayerStats: [{ playerId: "previous-player" } as never], hasLoadedHistoricalStats: true });
		useUserStore.setState({ users: [{ id: "previous-user" } as never], hasLoadedUsers: true });
		useEventStore.setState({ events: [{ id: "previous-event" } as never], hasLoadedEvents: true });
		usePostStore.setState({ posts: [{ id: "previous-post" } as never], hasLoadedPosts: true });
		useMessageStore.setState({ threads: [{ thread: { id: "previous-thread" } } as never] });
		useNotificationStore.setState({ notifications: [{ id: "previous-notification" } as never], hasLoadedNotifications: true });
		useClubTeamStore.setState({ profiles: [{ id: "previous-team" } as never], hasLoaded: true });

		resetTenantStores();

		expect(usePlayerStore.getState()).toMatchObject({ players: [], hasLoadedPlayers: false });
		expect(useMatchStore.getState()).toMatchObject({ matches: [], hasLoadedMatches: false });
		expect(useSeasonStore.getState()).toMatchObject({ seasons: [], hasLoadedSeasons: false });
		expect(useFinanceStore.getState()).toMatchObject({ playerFinanceRecords: [], hasLoadedFinance: false });
		expect(useStatsStore.getState()).toMatchObject({ seasonStats: [], hasLoadedStats: false });
		expect(useHistoricalStatsStore.getState()).toMatchObject({ historicalPlayerStats: [], hasLoadedHistoricalStats: false });
		expect(useUserStore.getState()).toMatchObject({ users: [], hasLoadedUsers: false });
		expect(useEventStore.getState()).toMatchObject({ events: [], hasLoadedEvents: false });
		expect(usePostStore.getState()).toMatchObject({ posts: [], hasLoadedPosts: false });
		expect(useMessageStore.getState()).toMatchObject({ threads: [], messages: [] });
		expect(useNotificationStore.getState()).toMatchObject({ notifications: [], hasLoadedNotifications: false });
		expect(useClubTeamStore.getState()).toMatchObject({ hasLoaded: false });
		expect(usePlayerStore.getState().loadPlayers).toBeTypeOf("function");
	});
});
