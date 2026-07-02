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
	getPlayerNumber: (playerId: string) => number | undefined;
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
	getPlayerNumber,
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
			className={`relative h-[480px] w-full min-w-0 overflow-hidden rounded-xl border-4 shadow-sm transition sm:h-[560px] xl:h-[580px] ${surface === "netball-court" ? "bg-blue-700" : surface === "cricket-field" ? "bg-green-600" : "bg-green-700"} ${
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

				if (occupant) {
					return null;
				}

				return (
					<button
						key={`${position.label}-${position.x}-${position.y}-${index}`}
						type="button"
						disabled={isLineupLocked}
						onClick={() => onOpenMobilePositionSelector?.(index)}
						className={`absolute z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-[10px] font-black transition sm:h-13 sm:w-13 sm:text-[11px] ${
							isHovered
								? "scale-110 text-yellow-300"
								: "text-white/85 hover:scale-105 hover:text-yellow-300 disabled:pointer-events-none"
						}`}
						style={{
							left: `${position.x}%`,
							top: `${position.y}%`,
						}}
						aria-label={`Select player for ${position.label}`}
					>
						<ShirtMarker
							label="+"
							subLabel={position.label}
							filled={isHovered}
						/>
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
						number={getPlayerNumber(selectedPlayer.playerId)}
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

function ShirtMarker({
	label,
	subLabel,
	filled = false,
}: {
	label: string;
	subLabel?: string;
	filled?: boolean;
}) {
	return (
		<span className="relative block h-full w-full drop-shadow-md" aria-hidden="true">
			<svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full">
				<path
					d="M20 6 27 2h10l7 4 15 8-8 15-7-4v35H20V25l-7 4-8-15Z"
					fill={filled ? "currentColor" : "rgba(255,255,255,.14)"}
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinejoin="round"
				/>
			</svg>
			<span className={`absolute inset-x-0 top-[22%] text-center leading-none ${filled ? "text-slate-950" : "text-white"}`}>
				{label}
			</span>
			{subLabel && label === "+" && (
				<span className="absolute inset-x-0 bottom-[12%] text-center text-[7px] leading-none text-white/90">
					{subLabel}
				</span>
			)}
		</span>
	);
}
