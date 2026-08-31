import { createContext } from "react";

import type { FinanceSummary } from "../../services/financeService";
import type { ReportsTeamFilter, ReportsVenueFilter } from "./utils/reportCalculations";

export type ReportsContextValue = {
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

export const ReportsContext = createContext<ReportsContextValue | null>(null);
