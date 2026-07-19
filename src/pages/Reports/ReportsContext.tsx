import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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
	type FinanceSummary,
} from "../../services/financeService";
import type { ReportsTeamFilter, ReportsVenueFilter } from "./utils/reportCalculations";

type ReportsContextValue = {
	selectedSeasonId: string;
	setSelectedSeasonId: (seasonId: string) => void;
	selectedTeamId: ReportsTeamFilter;
	setSelectedTeamId: (teamId: ReportsTeamFilter) => void;
	selectedCompetition: string;
	setSelectedCompetition: (competition: string) => void;
	selectedVenue: ReportsVenueFilter;
	setSelectedVenue: (venue: ReportsVenueFilter) => void;
	selectedPlayerId: string;
	setSelectedPlayerId: (playerId: string) => void;
	dateFrom: string;
	setDateFrom: (date: string) => void;
	dateTo: string;
	setDateTo: (date: string) => void;
	includeFriendlies: boolean;
	setIncludeFriendlies: (includeFriendlies: boolean) => void;
	canViewFinance: boolean;
	financeSummary?: FinanceSummary;
	isLoading: boolean;
	loadError: string;
};

const ReportsContext = createContext<ReportsContextValue | null>(null);

export function ReportsProvider({ children }: { children: ReactNode }) {
	const currentUser = useAuthStore((state) => state.currentUser);
	const canViewFinance = currentUser?.role === "Admin";
	const [selectedSeasonId, setSelectedSeasonId] = useState("");
	const [selectedTeamId, setSelectedTeamId] = useState<ReportsTeamFilter>("all");
	const [selectedCompetition, setSelectedCompetition] = useState("all");
	const [selectedVenue, setSelectedVenue] = useState<ReportsVenueFilter>("all");
	const [selectedPlayerId, setSelectedPlayerId] = useState("all");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [includeFriendlies, setIncludeFriendlies] = useState(true);

	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);
	const isLoadingSeasons = useSeasonStore((state) => state.isLoadingSeasons);
	const seasonLoadError = useSeasonStore((state) => state.seasonLoadError);

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
	const activeTeamExists = selectedTeamId === "all" || clubTeamProfiles.some((team) => team.id === selectedTeamId);

	useEffect(() => {
		void loadSeasons();
		void loadPlayers();
		void loadEvents();
		void loadClubTeams();
	}, [loadClubTeams, loadEvents, loadPlayers, loadSeasons]);

	useEffect(() => {
		if (selectedSeasonId && seasons.some((season) => season.id === selectedSeasonId)) {
			return;
		}

		setSelectedSeasonId(activeSeasonId || seasons[0]?.id || "");
	}, [activeSeasonId, seasons, selectedSeasonId]);

	useEffect(() => {
		if (!activeTeamExists) {
			setSelectedTeamId("all");
		}
	}, [activeTeamExists]);

	useEffect(() => {
		setSelectedCompetition("all");
		setSelectedVenue("all");
		setDateFrom("");
		setDateTo("");
	}, [selectedSeasonId, selectedTeamId]);

	useEffect(() => {
		if (selectedPlayerId !== "all" && !players.some((player) => player.id === selectedPlayerId)) {
			setSelectedPlayerId("all");
		}
	}, [players, selectedPlayerId]);

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
		]
	);

	return (
		<ReportsContext.Provider value={value}>
			{children}
		</ReportsContext.Provider>
	);
}

export function useReportsContext() {
	const context = useContext(ReportsContext);

	if (!context) {
		throw new Error("useReportsContext must be used inside ReportsProvider");
	}

	return context;
}
