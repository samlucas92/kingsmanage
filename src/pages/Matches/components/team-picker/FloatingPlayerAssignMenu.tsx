import type { SelectedPlayer } from "../../../../stores/match";
import { getFloatingPosition } from "../../../../utils/floatingPosition";
import { getPositionFitLabel } from "./PositionCompatibility";
import type { FormationPosition } from "./Types";

interface FloatingPlayerAssignMenuProps {
	playerId: string;
	left: number;
	top: number;
	formation: FormationPosition[];
	pitchPlayers: SelectedPlayer[];
	getPlayerName: (playerId: string) => string;
	getPlayerPositions: (playerId: string) => string[];
	isPlayerRecommendedForPosition: (
		playerId: string,
		positionLabel: string
	) => boolean;
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
	getPlayerPositions,
	isPlayerRecommendedForPosition,
	onAssignPosition,
	onAssignBench,
	onRemove,
	showRemove,
}: FloatingPlayerAssignMenuProps) {
	const playerPositions = getPlayerPositions(playerId);
	const menuStyle = getEstimatedMenuStyle(left, top);

	return (
		<div
			className="fixed z-50 w-60 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-xl"
			style={menuStyle}
		>
			<div className="px-2 pb-1.5">
				<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
					Assign position
				</p>

				{playerPositions.length > 0 && (
					<p className="mt-1 text-[11px] text-slate-500">
						Prefers: {playerPositions.join(", ")}
					</p>
				)}
			</div>

			<div className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
				{formation.map((position, index) => {
					const occupant = pitchPlayers.find(
						(pitchPlayer) => pitchPlayer.positionIndex === index
					);

					const occupiedByOtherPlayer =
						occupant && occupant.playerId !== playerId;

					const fitLabel = getPositionFitLabel(
						playerPositions,
						position.label
					);

					const isRecommended = isPlayerRecommendedForPosition(
						playerId,
						position.label
					);

					const isNatural = fitLabel === "Natural";

					return (
						<button
							key={`${position.label}-${index}`}
							type="button"
							disabled={occupiedByOtherPlayer}
							onClick={() => onAssignPosition(playerId, index)}
							className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 ${
								isRecommended ? "bg-green-50" : ""
							}`}
						>
							<span
								className={`font-semibold ${
									isRecommended ? "text-green-800" : "text-slate-800"
								}`}
							>
								{position.label}
							</span>

							<span className="flex min-w-0 items-center gap-1">
								{isRecommended && (
									<span
										className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
											isNatural
												? "bg-blue-100 text-blue-800"
												: "bg-green-100 text-green-800"
										}`}
									>
										{fitLabel}
									</span>
								)}

								<span className="truncate text-[11px] text-slate-500">
									{occupant ? getPlayerName(occupant.playerId) : "Empty"}
								</span>
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

function getEstimatedMenuStyle(left: number, top: number) {
	if (typeof window === "undefined") {
		return {
			left,
			top,
			maxHeight: 300,
		};
	}

	const anchorRect = {
		left,
		right: left,
		top,
		bottom: top,
	} as DOMRect;
	const position = getFloatingPosition({
		anchorRect,
		floatingWidth: 240,
		floatingHeight: 300,
		align: "left",
		bottomPadding: 12,
	});

	return {
		left: position.left,
		top: position.top,
		maxHeight: position.maxHeight,
	};
}
