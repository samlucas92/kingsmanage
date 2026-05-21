import { create } from "zustand";

export type MatchState = "upcoming" | "won" | "lost" | "draw" | "postponed";

export type LineupFormation = "4-4-2" | "4-3-3" | "3-5-2" | "4-2-3-1";

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

export type SelectedPlayer = {
  playerId: string;
  x: number;
  y: number;
  area: "pitch" | "bench";
  positionIndex?: number;
};

export type Match = {
  id: string;
  opponent: string;
  date: string;
  venue: "home" | "away";
  state: MatchState;
  result?: MatchResult;
  isCompleted: boolean;
  isLineupLocked: boolean;
  selectedFormation: LineupFormation;
  postponements: PostponementAudit[];
  selectedPlayers: SelectedPlayer[];
};

type MatchStore = {
  matches: Match[];

  postponeMatch: (matchId: string, newDate: string, reason?: string) => void;

  setResult: (matchId: string, result: MatchResult) => void;

  setSelectedPlayers: (
    matchId: string,
    selectedPlayers: SelectedPlayer[]
  ) => void;

  setLineupFormation: (
    matchId: string,
    formation: LineupFormation
  ) => void;

  updateSelectedPlayerPosition: (
    matchId: string,
    playerId: string,
    x: number,
    y: number,
    area?: "pitch" | "bench",
    positionIndex?: number
  ) => void;

  removeSelectedPlayer: (matchId: string, playerId: string) => void;

  toggleLineupLocked: (matchId: string) => void;
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
      isLineupLocked: false,
      selectedFormation: "4-4-2",
      postponements: [],
      selectedPlayers: [],
    },
    {
      id: "2",
      opponent: "Murton",
      date: "2026-08-08T14:00:00",
      venue: "away",
      state: "won",
      result: { homeGoals: 3, awayGoals: 1 },
      isCompleted: true,
      isLineupLocked: false,
      selectedFormation: "4-4-2",
      postponements: [],
      selectedPlayers: [],
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
        if (match.id !== matchId || match.isCompleted) {
          return match;
        }

        const nextState: MatchState =
          result.homeGoals > result.awayGoals
            ? "won"
            : result.homeGoals < result.awayGoals
            ? "lost"
            : "draw";

        return {
          ...match,
          result,
          state: nextState,
          isCompleted: true,
        };
      }),
    })),

  setSelectedPlayers: (matchId, selectedPlayers) =>
    set((state) => ({
      matches: state.matches.map((match) => {
        if (match.id !== matchId || match.isLineupLocked) {
          return match;
        }

        return {
          ...match,
          selectedPlayers,
        };
      }),
    })),

  setLineupFormation: (matchId, formation) =>
    set((state) => ({
      matches: state.matches.map((match) => {
        if (match.id !== matchId || match.isLineupLocked) {
          return match;
        }

        return {
          ...match,
          selectedFormation: formation,
        };
      }),
    })),

  updateSelectedPlayerPosition: (
    matchId,
    playerId,
    x,
    y,
    area,
    positionIndex
  ) =>
    set((state) => ({
      matches: state.matches.map((match) => {
        if (match.id !== matchId || match.isLineupLocked) {
          return match;
        }

        return {
          ...match,
          selectedPlayers: match.selectedPlayers.map((selectedPlayer) => {
            if (selectedPlayer.playerId !== playerId) {
              return selectedPlayer;
            }

            return {
              ...selectedPlayer,
              x,
              y,
              area: area ?? selectedPlayer.area,
              positionIndex,
            };
          }),
        };
      }),
    })),

  removeSelectedPlayer: (matchId, playerId) =>
    set((state) => ({
      matches: state.matches.map((match) => {
        if (match.id !== matchId || match.isLineupLocked) {
          return match;
        }

        return {
          ...match,
          selectedPlayers: match.selectedPlayers.filter(
            (player) => player.playerId !== playerId
          ),
        };
      }),
    })),

  toggleLineupLocked: (matchId) =>
    set((state) => ({
      matches: state.matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              isLineupLocked: !match.isLineupLocked,
            }
          : match
      ),
    })),
}));