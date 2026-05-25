import type { MouseEvent } from "react";
import StatusBadge from "../../../../components/compositions/StatusBadge";
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
	hoveredSwapTargetPlayerId?: string | null;
	onOpenPlayerMenu: (
		playerId: string,
		event: MouseEvent<HTMLButtonElement>
	) => void;
}

export function AvailablePlayersPanel({
	availablePlayers,
	isLineupLocked,
	openMenuPlayerId,
	hoveredSwapTargetPlayerId = null,
	onOpenPlayerMenu,
}: AvailablePlayersPanelProps) {
	return (
		<div className="flex max-h-[360px] min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:h-[520px] xl:max-h-none">
			<div className="mb-3 flex shrink-0 items-start justify-between gap-3">
				<div className="min-w-0">
					<h3 className="text-sm font-semibold text-slate-900">
						Available players
					</h3>

					<p className="mt-1 text-xs text-slate-500">
						Drag or tap a player to assign them.
					</p>
				</div>

				<StatusBadge label={String(availablePlayers.length)} tone="neutral" />
			</div>

			{isLineupLocked && (
				<p className="mb-3 shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
					Team saved. Click Edit Team to make changes.
				</p>
			)}

			<div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
				<div className="grid grid-cols-1 gap-2 pb-1 sm:grid-cols-2 xl:grid-cols-1">
					{availablePlayers.map((player) => (
						<AvailablePlayer
							key={player.id}
							id={player.id}
							name={player.name}
							disabled={isLineupLocked}
							isMenuOpen={openMenuPlayerId === player.id}
							isSwapTarget={hoveredSwapTargetPlayerId === player.id}
							onOpenMenu={(event) => onOpenPlayerMenu(player.id, event)}
						/>
					))}

					{availablePlayers.length === 0 && (
						<p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
							All active players are already selected.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}