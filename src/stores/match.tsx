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

export type SelectedPlayer = {
  playerId: string;
  x: number;
  y: number;
  area: "pitch" | "bench";
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

  upsertSelectedPlayer: (
    matchId: string,
    selectedPlayer: SelectedPlayer
  ) => void;

  updateSelectedPlayerPosition: (
    matchId: string,
    playerId: string,
    x: number,
    y: number,
    area?: "pitch" | "bench"
  ) => void;

  removeSelectedPlayer: (matchId: string, playerId: string) => void;
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
      matches: state.matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              selectedPlayers,
            }
          : match
      ),
    })),

  upsertSelectedPlayer: (matchId, selectedPlayer) =>
    set((state) => ({
      matches: state.matches.map((match) => {
        if (match.id !== matchId) {
          return match;
        }

        const alreadySelected = match.selectedPlayers.some(
          (player) => player.playerId === selectedPlayer.playerId
        );

        return {
          ...match,
          selectedPlayers: alreadySelected
            ? match.selectedPlayers.map((player) =>
                player.playerId === selectedPlayer.playerId
                  ? selectedPlayer
                  : player
              )
            : [...match.selectedPlayers, selectedPlayer],
        };
      }),
    })),

  updateSelectedPlayerPosition: (matchId, playerId, x, y, area) =>
    set((state) => ({
      matches: state.matches.map((match) => {
        if (match.id !== matchId) {
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
            };
          }),
        };
      }),
    })),

  removeSelectedPlayer: (matchId, playerId) =>
    set((state) => ({
      matches: state.matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              selectedPlayers: match.selectedPlayers.filter(
                (player) => player.playerId !== playerId
              ),
            }
          : match
      ),
    })),
}));