import type { MouseEvent } from "react";
import { AvailablePlayer } from "./PlayerCards";

type Player = {
  id: string;
  name: string;
  isActive: boolean;
};

interface AvailablePlayersPanelProps {
  availablePlayers: Player[];
  isLineupLocked: boolean;
  openMenuPlayerId?: string;
  onOpenPlayerMenu: (
    playerId: string,
    event: MouseEvent<HTMLButtonElement>
  ) => void;
}

export function AvailablePlayersPanel({
  availablePlayers,
  isLineupLocked,
  openMenuPlayerId,
  onOpenPlayerMenu,
}: AvailablePlayersPanelProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Available players
        </h3>

        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
          {availablePlayers.length}
        </span>
      </div>

      {isLineupLocked && (
        <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
          Team saved. Click Edit Team to make changes.
        </p>
      )}

      <div className="relative space-y-2 overflow-visible pr-1">
        {availablePlayers.map((player) => (
          <AvailablePlayer
            key={player.id}
            id={player.id}
            name={player.name}
            disabled={isLineupLocked}
            isMenuOpen={openMenuPlayerId === player.id}
            onOpenMenu={(event) => onOpenPlayerMenu(player.id, event)}
          />
        ))}

        {availablePlayers.length === 0 && (
          <p className="text-sm text-slate-500">
            All active players are already selected.
          </p>
        )}
      </div>
    </div>
  );
}