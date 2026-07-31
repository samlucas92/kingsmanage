import type { MouseEvent } from "react";
import StatusBadge from "../../../../components/compositions/StatusBadge";
import type { ClubEventAvailabilityStatus } from "../../../../types/events";
import type { TrainingAvailabilitySummary } from "../../../../utils/trainingAvailability";
import { AvailablePlayer } from "./PlayerCards";

type Player = {
	id: string;
	name: string;
	isActive: boolean;
};

interface AvailablePlayersPanelProps {
	availablePlayers: Player[];
	isLineupLocked: boolean;
	showAvailableOnly: boolean;
	canFilterByAvailability: boolean;
	openMenuPlayerId?: string;
	hoveredSwapTargetPlayerId?: string | null;
	getPlayerAvailabilityStatus?: (
		playerId: string
	) => ClubEventAvailabilityStatus | undefined;
	getPlayerTrainingAvailability?: (
		playerId: string
	) => TrainingAvailabilitySummary;
	onOpenPlayerMenu: (
		playerId: string,
		event: MouseEvent<HTMLButtonElement>
	) => void;
	onShowAvailableOnlyChange: (value: boolean) => void;
}

export function AvailablePlayersPanel({
	availablePlayers,
	isLineupLocked,
	showAvailableOnly,
	canFilterByAvailability,
	openMenuPlayerId,
	hoveredSwapTargetPlayerId = null,
	getPlayerAvailabilityStatus,
	getPlayerTrainingAvailability,
	onOpenPlayerMenu,
	onShowAvailableOnlyChange,
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

			<label className={`mb-3 flex shrink-0 items-start gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
				canFilterByAvailability
					? "border-yepset-100 bg-yepset-50 text-yepset-900"
					: "border-slate-200 bg-slate-50 text-slate-400"
			}`}>
				<input
					type="checkbox"
					checked={showAvailableOnly}
					disabled={!canFilterByAvailability || isLineupLocked}
					onChange={(event) => onShowAvailableOnlyChange(event.target.checked)}
					className="mt-0.5 h-4 w-4 rounded border-slate-300"
				/>
				<span>
					Show available only
					<span className="block font-medium">
						{canFilterByAvailability
							? "Uses linked match event responses."
							: "Link this match to an event to filter by responses."}
					</span>
				</span>
			</label>

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
							availabilityStatus={getPlayerAvailabilityStatus?.(player.id)}
							trainingAvailability={getPlayerTrainingAvailability?.(player.id)}
							onOpenMenu={(event) => onOpenPlayerMenu(player.id, event)}
						/>
					))}

					{availablePlayers.length === 0 && (
						<p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
							No available players match the current filters.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
