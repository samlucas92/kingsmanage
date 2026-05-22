import type { MouseEvent, RefObject } from "react";
import type { SelectedPlayer } from "../../../../stores/match";
import { isPositionCompatible } from "./PositionCompatibility";
import type { FormationPosition } from "./Types";
import { SelectedPitchPlayer } from "./PlayerCards";

interface TeamPitchProps {
	pitchRef: RefObject<HTMLDivElement | null>;
	isOverPitch: boolean;
	formation: FormationPosition[];
	hoveredFormationIndex: number | null;
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
}

export function TeamPitch({
	pitchRef,
	isOverPitch,
	formation,
	hoveredFormationIndex,
	pitchPlayers,
	isLineupLocked,
	openMenuPlayerId,
	getPositionOccupant,
	getPlayerName,
	getPlayerPositions,
	getPlayerInitials,
	onOpenPlayerMenu,
}: TeamPitchProps) {
	return (
		<div
			ref={pitchRef}
			className={`relative h-[360px] w-full overflow-hidden rounded-xl border-4 bg-green-700 shadow-sm ${
				isOverPitch ? "border-yellow-300" : "border-white"
			}`}
		>
			<div className="absolute inset-4 rounded-lg border-2 border-white/80" />

			<div className="absolute left-4 top-4 h-0.5 w-[calc(100%-2rem)] bg-white/80" />

			<div className="absolute left-1/2 top-4 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80" />

			<div className="absolute bottom-4 left-1/2 h-28 w-56 -translate-x-1/2 border-2 border-b-0 border-white/80" />

			<div className="absolute bottom-4 left-1/2 h-12 w-28 -translate-x-1/2 border-2 border-b-0 border-white/80" />

			<div className="absolute bottom-1 left-1/2 h-3 w-24 -translate-x-1/2 rounded-t border-2 border-b-0 border-white/80" />

			<div className="absolute bottom-[100px] left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-white/80" />

			{formation.map((position, index) => {
				const isHovered = hoveredFormationIndex === index;
				const occupant = getPositionOccupant(index);

				return (
					<div
						key={`${position.label}-${position.x}-${position.y}-${index}`}
						className={`pointer-events-none absolute z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[10px] font-bold transition ${
							isHovered
								? "scale-110 border-yellow-300 bg-yellow-300 text-slate-900"
								: occupant
									? "border-white/60 bg-white/20 text-white/80"
									: "border-white/40 bg-white/10 text-white/70"
						}`}
						style={{
							left: `${position.x}%`,
							top: `${position.y}%`,
						}}
					>
						{position.label}
					</div>
				);
			})}

			{pitchPlayers.map((selectedPlayer) => {
				const playerName = getPlayerName(selectedPlayer.playerId);
				const preferredPositions = getPlayerPositions(selectedPlayer.playerId);

				const assignedPosition =
					selectedPlayer.positionIndex !== undefined
						? formation[selectedPlayer.positionIndex]
						: undefined;

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
						x={selectedPlayer.x}
						y={selectedPlayer.y}
						disabled={isLineupLocked}
						isMenuOpen={openMenuPlayerId === selectedPlayer.playerId}
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