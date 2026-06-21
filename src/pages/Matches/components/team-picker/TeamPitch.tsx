import type { MouseEvent, RefObject } from "react";
import type { SelectedPlayer } from "../../../../stores/match";
import { isPositionCompatible } from "./PositionCompatibility";
import type { FormationPosition } from "./Types";
import type { SportSurface } from "../../../../constants/sports";
import { resolveLineupPosition } from "../../../../utils/lineupPosition";
import { SelectedPitchPlayer } from "./PlayerCards";

interface TeamPitchProps {
	pitchRef: RefObject<HTMLDivElement | null>;
	isOverPitch: boolean;
	formation: FormationPosition[];
	surface: SportSurface;
	hoveredFormationIndex: number | null;
	hoveredSwapTargetPlayerId: string | null;
	pitchPlayers: SelectedPlayer[];
	isLineupLocked: boolean;
	openMenuPlayerId?: string;
	getPositionOccupant: (positionIndex: number) => SelectedPlayer | undefined;
	getPlayerName: (playerId: string) => string;
	getPlayerPositions: (playerId: string) => string[];
	getPlayerInitials: (name: string) => string;
	onOpenPlayerMenu: (
		playerId: string,
		event: MouseEvent<HTMLButtonElement>
	) => void;
	onOpenMobilePositionSelector?: (positionIndex: number) => void;
}

export function TeamPitch({
	pitchRef,
	isOverPitch,
	formation,
	surface,
	hoveredFormationIndex,
	hoveredSwapTargetPlayerId,
	pitchPlayers,
	isLineupLocked,
	openMenuPlayerId,
	getPositionOccupant,
	getPlayerName,
	getPlayerPositions,
	getPlayerInitials,
	onOpenPlayerMenu,
	onOpenMobilePositionSelector,
}: TeamPitchProps) {
	const hasAvailablePosition = formation.some(
		(_position, index) => !getPositionOccupant(index)
	);

	return (
		<div
			ref={pitchRef}
			className={`relative h-[520px] w-full min-w-0 overflow-hidden rounded-xl border-4 shadow-sm transition sm:h-[560px] xl:h-[580px] ${surface === "netball-court" ? "bg-blue-700" : surface === "cricket-field" ? "bg-green-600" : "bg-green-700"} ${
				isOverPitch
					? hasAvailablePosition || hoveredSwapTargetPlayerId
						? "border-yellow-300"
						: "border-red-300"
					: "border-white"
			}`}
		>
			<SurfaceMarkings surface={surface} />

			{isOverPitch && !hasAvailablePosition && !hoveredSwapTargetPlayerId && (
				<div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 shadow">
					No empty positions — drop on a player to swap
				</div>
			)}

			{formation.map((position, index) => {
				const isHovered = hoveredFormationIndex === index;
				const occupant = getPositionOccupant(index);

				return (
					<button
						key={`${position.label}-${position.x}-${position.y}-${index}`}
						type="button"
						disabled={isLineupLocked || Boolean(occupant)}
						onClick={() => onOpenMobilePositionSelector?.(index)}
						className={`absolute z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[10px] font-bold transition sm:h-11 sm:w-11 sm:text-[11px] ${
							isHovered
								? "scale-110 border-yellow-300 bg-yellow-300 text-slate-900"
								: occupant
									? "pointer-events-none border-white/60 bg-white/20 text-white/80"
									: "border-white/70 bg-white/10 text-white hover:scale-105 hover:border-yellow-300 hover:bg-yellow-300 hover:text-slate-900 disabled:pointer-events-none"
						}`}
						style={{
							left: `${position.x}%`,
							top: `${position.y}%`,
						}}
						aria-label={`Select player for ${position.label}`}
					>
						{occupant ? position.label : "+"}
					</button>
				);
			})}

			{pitchPlayers.map((selectedPlayer) => {
				const playerName = getPlayerName(selectedPlayer.playerId);
				const preferredPositions = getPlayerPositions(selectedPlayer.playerId);

				const assignedPosition =
					formation.find((position) => position.key === selectedPlayer.positionKey) ??
					(selectedPlayer.positionIndex !== undefined ? formation[selectedPlayer.positionIndex] : undefined);
				const displayPosition = resolveLineupPosition(selectedPlayer, formation);

				const isOutOfPosition =
					assignedPosition !== undefined &&
					preferredPositions.length > 0 &&
					!isPositionCompatible(preferredPositions, assignedPosition.label);

				return (
					<SelectedPitchPlayer
						key={selectedPlayer.playerId}
						playerId={selectedPlayer.playerId}
						name={playerName}
						initials={getPlayerInitials(playerName)}
						x={displayPosition.x}
						y={displayPosition.y}
						disabled={isLineupLocked}
						isMenuOpen={openMenuPlayerId === selectedPlayer.playerId}
						isSwapTarget={
							hoveredSwapTargetPlayerId === selectedPlayer.playerId
						}
						isOutOfPosition={isOutOfPosition}
						preferredPositions={preferredPositions}
						onOpenMenu={(event) =>
							onOpenPlayerMenu(selectedPlayer.playerId, event)
						}
					/>
				);
			})}
		</div>
	);
}

function SurfaceMarkings({ surface }: { surface: SportSurface }) {
	if (surface === "cricket-field") {
		return <><div className="absolute inset-5 rounded-[50%] border-2 border-white/70" /><div className="absolute left-1/2 top-1/2 h-48 w-12 -translate-x-1/2 -translate-y-1/2 border-2 border-amber-100/80 bg-amber-200/40" /></>;
	}
	if (surface === "netball-court") {
		return <><div className="absolute inset-4 border-2 border-white/80" /><div className="absolute inset-x-4 top-1/3 border-t-2 border-white/80" /><div className="absolute inset-x-4 top-2/3 border-t-2 border-white/80" /><div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80" /></>;
	}
	if (surface === "rugby-pitch") {
		return <><div className="absolute inset-4 border-2 border-white/80" />{[22, 50, 78].map((top) => <div key={top} className="absolute inset-x-4 border-t-2 border-white/70" style={{ top: `${top}%` }} />)}</>;
	}
	return <><div className="absolute inset-4 rounded-lg border-2 border-white/80" /><div className="absolute inset-x-4 top-1/2 border-t-2 border-white/80" /><div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80" /><div className="absolute bottom-4 left-1/2 h-32 w-56 -translate-x-1/2 border-2 border-b-0 border-white/80" /></>;
}
