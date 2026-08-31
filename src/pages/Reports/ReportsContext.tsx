import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useEventStore } from "../../stores/events";
import { useFinanceStore } from "../../stores/finance";
import { useMatchStore } from "../../stores/match";
import { usePlayerStore } from "../../stores/players";
import { useSeasonStore } from "../../stores/seasons";
import { useStatsStore } from "../../stores/stats";
import { useAuthStore } from "../../stores/auth";
import { useClubTeamStore } from "../../stores/clubTeams";
import {
	buildFinanceRows,
	getFinanceSummary,
} from "../../services/financeService";
import type { ReportsTeamFilter, ReportsVenueFilter } from "./utils/reportCalculations";
import { ReportsContext } from "./reportsContextValue";

export function ReportsProvider({ children }: { children: ReactNode }) {
	const currentUser = useAuthStore((state) => state.currentUser);
	const canViewFinance = currentUser?.role === "Admin";
	const [selectedSeasonSelection, setSelectedSeasonId] = useState("");
	const [selectedTeamSelection, setSelectedTeamId] = useState<ReportsTeamFilter>("all");
	const [selectedPlayerSelection, setSelectedPlayerId] = useState("all");
	const [includeFriendlies, setIncludeFriendlies] = useState(true);

	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);
	const isLoadingSeasons = useSeasonStore((state) => state.isLoadingSeasons);
	const seasonLoadError = useSeasonStore((state) => state.seasonLoadError);
	const selectedSeasonId = seasons.some((season) => season.id === selectedSeasonSelection)
		? selectedSeasonSelection
		: activeSeasonId || seasons[0]?.id || "";

	const loadMatches = useMatchStore((state) => state.loadMatches);
	const isLoadingMatches = useMatchStore((state) => state.isLoadingMatches);
	const matchLoadError = useMatchStore((state) => state.matchLoadError);

	const loadPlayers = usePlayerStore((state) => state.loadPlayers);
	const players = usePlayerStore((state) => state.players);
	const isLoadingPlayers = usePlayerStore((state) => state.isLoadingPlayers);
	const playerLoadError = usePlayerStore((state) => state.playerLoadError);

	const loadEvents = useEventStore((state) => state.loadEvents);
	const isLoadingEvents = useEventStore((state) => state.isLoadingEvents);
	const eventsLoadError = useEventStore((state) => state.eventsLoadError);

	const loadSeasonStats = useStatsStore((state) => state.loadSeasonStats);
	const isLoadingStats = useStatsStore((state) => state.isLoadingStats);
	const statsLoadError = useStatsStore((state) => state.statsLoadError);

	const playerFinanceRecords = useFinanceStore((state) => state.playerFinanceRecords);
	const loadFinance = useFinanceStore((state) => state.loadFinance);
	const isLoadingFinance = useFinanceStore((state) => state.isLoadingFinance);
	const financeLoadError = useFinanceStore((state) => state.financeLoadError);

	const clubTeamProfiles = useClubTeamStore((state) => state.profiles);
	const loadClubTeams = useClubTeamStore((state) => state.loadProfiles);
	const selectedTeamId = selectedTeamSelection === "all" ||
		clubTeamProfiles.some((team) => team.id === selectedTeamSelection)
		? selectedTeamSelection
		: "all";
	const selectedPlayerId = selectedPlayerSelection === "all" ||
		players.some((player) => player.id === selectedPlayerSelection)
		? selectedPlayerSelection
		: "all";
	const filterScope = `${selectedSeasonId}:${selectedTeamId}`;
	const [selectedCompetition, setSelectedCompetition] = useScopedState(filterScope, "all");
	const [selectedVenue, setSelectedVenue] = useScopedState<ReportsVenueFilter>(filterScope, "all");
	const [dateFrom, setDateFrom] = useScopedState(filterScope, "");
	const [dateTo, setDateTo] = useScopedState(filterScope, "");

	useEffect(() => {
		void loadSeasons();
		void loadPlayers();
		void loadEvents();
		void loadClubTeams();
	}, [loadClubTeams, loadEvents, loadPlayers, loadSeasons]);

	useEffect(() => {
		if (!selectedSeasonId) {
			return;
		}

		void loadMatches(selectedSeasonId);
		void loadSeasonStats(selectedSeasonId, true);

		if (canViewFinance) {
			void loadFinance(selectedSeasonId);
		}
	}, [canViewFinance, loadFinance, loadMatches, loadSeasonStats, selectedSeasonId]);

	const financeSummary = useMemo(() => {
		if (!selectedSeasonId || !canViewFinance) {
			return undefined;
		}

		const financeRows = buildFinanceRows({
			players,
			playerFinanceRecords,
			seasonId: selectedSeasonId,
			includeInactive: false,
		});

		return getFinanceSummary(financeRows);
	}, [canViewFinance, playerFinanceRecords, players, selectedSeasonId]);

	const isLoading =
		isLoadingSeasons ||
		isLoadingMatches ||
		isLoadingPlayers ||
		isLoadingEvents ||
		isLoadingStats ||
		(canViewFinance && isLoadingFinance);
	const loadError =
		seasonLoadError ||
		matchLoadError ||
		playerLoadError ||
		eventsLoadError ||
		statsLoadError ||
		(canViewFinance ? financeLoadError : "");

	const value = useMemo(
		() => ({
			selectedSeasonId,
			setSelectedSeasonId,
			selectedTeamId,
			setSelectedTeamId,
			selectedCompetition,
			setSelectedCompetition,
			selectedVenue,
			setSelectedVenue,
			selectedPlayerId,
			setSelectedPlayerId,
			dateFrom,
			setDateFrom,
			dateTo,
			setDateTo,
			includeFriendlies,
			setIncludeFriendlies,
			canViewFinance,
			financeSummary,
			isLoading,
			loadError,
		}),
		[
			canViewFinance,
			financeSummary,
			isLoading,
			loadError,
			dateFrom,
			dateTo,
			includeFriendlies,
			selectedSeasonId,
			selectedCompetition,
			selectedPlayerId,
			selectedTeamId,
			selectedVenue,
			setDateFrom,
			setDateTo,
			setSelectedCompetition,
			setSelectedVenue,
		]
	);

	return (
		<ReportsContext.Provider value={value}>
			{children}
		</ReportsContext.Provider>
	);
}

function useScopedState<T>(scope: string, defaultValue: T) {
	const [state, setState] = useState({ scope, value: defaultValue });
	const value = state.scope === scope ? state.value : defaultValue;
	const setValue = useCallback((nextValue: T) => {
		setState({ scope, value: nextValue });
	}, [scope]);
	return [value, setValue] as const;
}
