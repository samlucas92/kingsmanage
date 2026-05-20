import { create } from "zustand";

export type MatchState = "upcoming" | "won" | "lost" | "draw" | "postponed";

export type PostponementAudit = {
  id: string;
  oldDate: string;
  newDate: string;
  reason?: string;
  changedAt: string;
};

export type MatchResult = {
  homeGoals: number;
  awayGoals: number;
};

export type Match = {
  id: string;
  opponent: string;
  date: string;
  venue: "home" | "away";
  state: MatchState;
  result?: MatchResult;
  isCompleted: boolean;
  postponements: PostponementAudit[];
  selectedPlayerIds: string[];
};

type MatchStore = {
  matches: Match[];
  postponeMatch: (matchId: string, newDate: string, reason?: string) => void;
  setResult: (matchId: string, result: MatchResult) => void;
  setSelectedPlayers: (matchId: string, playerIds: string[]) => void;
};

export const useMatchStore = create<MatchStore>((set) => ({
  matches: [
    {
      id: "1",
      opponent: "St Thomas Stars",
      date: "2026-08-15T14:00:00",
      venue: "home",
      state: "upcoming",
      isCompleted: false,
      postponements: [],
      selectedPlayerIds: [],
    },
    {
      id: "2",
      opponent: "Murton",
      date: "2026-08-08T14:00:00",
      venue: "away",
      state: "won",
      result: { homeGoals: 3, awayGoals: 1 },
      isCompleted: true,
      postponements: [],
      selectedPlayerIds: [],
    },
  ],

  postponeMatch: (matchId, newDate, reason) =>
    set((state) => ({
      matches: state.matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              postponements: [
                ...match.postponements,
                {
                  id: crypto.randomUUID(),
                  oldDate: match.date,
                  newDate,
                  reason,
                  changedAt: new Date().toISOString(),
                },
              ],
              date: newDate,
              state: "postponed",
            }
          : match
      ),
    })),

  setResult: (matchId, result) =>
    set((state) => ({
      matches: state.matches.map((match) => {
        if (match.id !== matchId || match.isCompleted) return match;

        const stateResult =
          result.homeGoals > result.awayGoals
            ? "won"
            : result.homeGoals < result.awayGoals
            ? "lost"
            : "draw";

        return {
          ...match,
          result,
          state: stateResult,
          isCompleted: true,
        };
      }),
    })),

  setSelectedPlayers: (matchId, playerIds) =>
    set((state) => ({
      matches: state.matches.map((match) =>
        match.id === matchId
          ? { ...match, selectedPlayerIds: playerIds }
          : match
      ),
    })),
}));