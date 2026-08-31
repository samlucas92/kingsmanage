import { useClubTeamStore } from "./clubTeams";
import { useEventStore } from "./events";
import { useFinanceStore } from "./finance";
import { useHistoricalStatsStore } from "./historicalStats";
import { useMatchStore } from "./match";
import { useMessageStore } from "./messages";
import { useNotificationStore } from "./notifications";
import { useOrganizationLocationsStore } from "./organizationLocations";
import { usePlayerStore } from "./players";
import { usePostStore } from "./posts";
import { useRealtimeStore } from "./realtime";
import { useSeasonStore } from "./seasons";
import { useStatsStore } from "./stats";
import { useUserStore } from "./users";

/**
 * Clears all state whose contents are scoped to the current organization or club.
 * Store actions are restored alongside their initial data so this is safe between
 * SPA sessions without requiring a full page reload.
 */
export function resetTenantStores() {
	void useRealtimeStore.getState().stop();

	useClubTeamStore.setState(useClubTeamStore.getInitialState(), true);
	useEventStore.setState(useEventStore.getInitialState(), true);
	useFinanceStore.setState(useFinanceStore.getInitialState(), true);
	useHistoricalStatsStore.setState(useHistoricalStatsStore.getInitialState(), true);
	useMatchStore.setState(useMatchStore.getInitialState(), true);
	useMessageStore.setState(useMessageStore.getInitialState(), true);
	useNotificationStore.setState(useNotificationStore.getInitialState(), true);
	useOrganizationLocationsStore.setState(useOrganizationLocationsStore.getInitialState(), true);
	usePlayerStore.setState(usePlayerStore.getInitialState(), true);
	usePostStore.setState(usePostStore.getInitialState(), true);
	useSeasonStore.setState(useSeasonStore.getInitialState(), true);
	useStatsStore.setState(useStatsStore.getInitialState(), true);
	useUserStore.setState(useUserStore.getInitialState(), true);
}
