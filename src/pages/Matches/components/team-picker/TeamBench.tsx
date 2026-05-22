import type { MouseEvent, RefObject } from "react";
import type { SelectedPlayer } from "../../../../stores/match";
import { BenchPlayer } from "./PlayerCards";

interface TeamBenchProps {
  benchRef: RefObject<HTMLDivElement | null>;
  isOverBench: boolean;
  benchPlayers: SelectedPlayer[];
  isLineupLocked: boolean;
  openMenuPlayerId?: string;
  getPlayerName: (playerId: string) => string;
  onOpenPlayerMenu: (
    playerId: string,
    event: MouseEvent<HTMLButtonElement>
  ) => void;
}

export function TeamBench({
  benchRef,
  isOverBench,
  benchPlayers,
  isLineupLocked,
  openMenuPlayerId,
  getPlayerName,
  onOpenPlayerMenu,
}: TeamBenchProps) {
  return (
    <div
      ref={benchRef}
      className={`rounded-xl border-2 bg-white p-3 shadow-sm ${
        isOverBench ? "border-yellow-400" : "border-slate-200"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Bench</h3>
          <p className="text-xs text-slate-500">
            {isLineupLocked ? "Bench is locked." : "Drop subs here."}
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {benchPlayers.length}
        </span>
      </div>

      <div className="grid min-h-16 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {benchPlayers.map((selectedPlayer) => (
          <BenchPlayer
            key={selectedPlayer.playerId}
            playerId={selectedPlayer.playerId}
            name={getPlayerName(selectedPlayer.playerId)}
            disabled={isLineupLocked}
            isMenuOpen={openMenuPlayerId === selectedPlayer.playerId}
            onOpenMenu={(event) =>
              onOpenPlayerMenu(selectedPlayer.playerId, event)
            }
          />
        ))}

        {benchPlayers.length === 0 && (
          <p className="text-sm text-slate-500 sm:col-span-2 xl:col-span-3">
            {isLineupLocked
              ? "No substitutes selected."
              : "Drag players here to put them on the bench."}
          </p>
        )}
      </div>
    </div>
  );
}