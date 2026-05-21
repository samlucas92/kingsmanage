import type { SelectedPlayer } from "../../../../stores/match";
import type { FormationPosition } from "./Types";

interface FloatingPlayerAssignMenuProps {
  playerId: string;
  left: number;
  top: number;
  formation: FormationPosition[];
  pitchPlayers: SelectedPlayer[];
  getPlayerName: (playerId: string) => string;
  onAssignPosition: (playerId: string, positionIndex: number) => void;
  onAssignBench: (playerId: string) => void;
  onRemove: (playerId: string) => void;
  showRemove: boolean;
}

export function FloatingPlayerAssignMenu({
  playerId,
  left,
  top,
  formation,
  pitchPlayers,
  getPlayerName,
  onAssignPosition,
  onAssignBench,
  onRemove,
  showRemove,
}: FloatingPlayerAssignMenuProps) {
  return (
    <div
      className="fixed z-50 w-60 rounded-lg border border-slate-200 bg-white p-2 shadow-xl"
      style={{
        left,
        top,
      }}
    >
      <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Assign position
      </p>

      <div className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
        {formation.map((position, index) => {
          const occupant = pitchPlayers.find(
            (pitchPlayer) => pitchPlayer.positionIndex === index
          );

          const occupiedByOtherPlayer =
            occupant && occupant.playerId !== playerId;

          return (
            <button
              key={`${position.label}-${index}`}
              type="button"
              disabled={occupiedByOtherPlayer}
              onClick={() => onAssignPosition(playerId, index)}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="font-semibold text-slate-800">
                {position.label}
              </span>

              <span className="truncate text-[11px] text-slate-500">
                {occupant ? getPlayerName(occupant.playerId) : "Empty"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-1.5 border-t border-slate-100 pt-1.5">
        <button
          type="button"
          onClick={() => onAssignBench(playerId)}
          className="w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          Move to bench
        </button>

        {showRemove && (
          <button
            type="button"
            onClick={() => onRemove(playerId)}
            className="w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Remove from team
          </button>
        )}
      </div>
    </div>
  );
}