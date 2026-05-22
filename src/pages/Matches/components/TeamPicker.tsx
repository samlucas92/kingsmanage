import { DndContext, DragOverlay } from "@dnd-kit/core";
import type { LineupFormation } from "../../../stores/match";
import { formations } from "./team-picker/Formations";
import { DragOverlayPlayer } from "./team-picker/PlayerCards";
import { FloatingPlayerAssignMenu } from "./team-picker/FloatingPlayerAssignMenu";
import { TeamPitch } from "./team-picker/TeamPitch";
import { TeamBench } from "./team-picker/TeamBench";
import { AvailablePlayersPanel } from "./team-picker/AvailablePlayersPanel";
import { useTeamPicker } from "./team-picker/useTeamPicker";

interface TeamPickerProps {
	matchId: string;
}

export default function TeamPicker({ matchId }: TeamPickerProps) {
	const teamPicker = useTeamPicker(matchId);

	if (!teamPicker.match) {
		return (
			<div className="rounded-lg border border-slate-200 bg-white p-4">
				Match not found.
			</div>
		);
	}

	return (
		<DndContext
			onDragStart={teamPicker.handleDragStart}
			onDragMove={teamPicker.handleDragMove}
			onDragEnd={teamPicker.handleDragEnd}
			onDragCancel={teamPicker.handleDragCancel}
		>
			<div className="grid items-start gap-4 lg:grid-cols-[260px_1fr]">
				<AvailablePlayersPanel
					availablePlayers={teamPicker.availablePlayers}
					isLineupLocked={teamPicker.isLineupLocked}
					openMenuPlayerId={teamPicker.openMenu?.playerId}
					onOpenPlayerMenu={teamPicker.openPlayerMenu}
				/>

				<div className="space-y-3">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h3 className="text-sm font-semibold text-slate-900">
								Starting XI
							</h3>

							<p className="text-xs text-slate-500">
								{teamPicker.isLineupLocked
									? "This team is saved and locked."
									: "Drag players or click a player to assign a position."}
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							{(
								["4-4-2", "4-3-3", "3-5-2", "4-2-3-1"] as LineupFormation[]
							).map((formationName) => (
								<button
									key={formationName}
									type="button"
									onClick={() => teamPicker.applyFormation(formationName)}
									disabled={teamPicker.isLineupLocked}
									className={`rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
										teamPicker.selectedFormation === formationName
											? "border-blue-700 bg-blue-700 text-white"
											: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
									}`}
								>
									{formationName}
								</button>
							))}

							<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
								{teamPicker.pitchPlayers.length}/11
							</span>
						</div>
					</div>

					<TeamPitch
						pitchRef={teamPicker.pitchRef}
						isOverPitch={teamPicker.isOverPitch}
						formation={formations[teamPicker.selectedFormation]}
						hoveredFormationIndex={teamPicker.hoveredFormationIndex}
						pitchPlayers={teamPicker.pitchPlayers}
						isLineupLocked={teamPicker.isLineupLocked}
						openMenuPlayerId={teamPicker.openMenu?.playerId}
						getPositionOccupant={teamPicker.getPositionOccupant}
						getPlayerName={teamPicker.getPlayerName}
						getPlayerPositions={teamPicker.getPlayerPositions}
						getPlayerInitials={teamPicker.getPlayerInitials}
						onOpenPlayerMenu={teamPicker.openPlayerMenu}
					/>

					<TeamBench
						benchRef={teamPicker.benchRef}
						isOverBench={teamPicker.isOverBench}
						benchPlayers={teamPicker.benchPlayers}
						isLineupLocked={teamPicker.isLineupLocked}
						openMenuPlayerId={teamPicker.openMenu?.playerId}
						getPlayerName={teamPicker.getPlayerName}
						onOpenPlayerMenu={teamPicker.openPlayerMenu}
					/>
				</div>
			</div>

			{teamPicker.openMenu && (
				<>
					<button
						type="button"
						aria-label="Close player menu"
						className="fixed inset-0 z-40 cursor-default bg-transparent"
						onClick={() => teamPicker.setOpenMenu(null)}
					/>

					<FloatingPlayerAssignMenu
						playerId={teamPicker.openMenu.playerId}
						left={teamPicker.openMenu.left}
						top={teamPicker.openMenu.top}
						formation={formations[teamPicker.selectedFormation]}
						pitchPlayers={teamPicker.pitchPlayers}
						getPlayerName={teamPicker.getPlayerName}
						getPlayerPositions={teamPicker.getPlayerPositions}
						isPlayerRecommendedForPosition={
							teamPicker.isPlayerRecommendedForPosition
						}
						onAssignPosition={teamPicker.assignPlayerToPosition}
						onAssignBench={teamPicker.assignPlayerToBench}
						onRemove={teamPicker.removePlayerFromSelection}
						showRemove={teamPicker.openMenuPlayerIsSelected}
					/>
				</>
			)}

			<DragOverlay>
				{teamPicker.activeDragData ? (
					<DragOverlayPlayer
						name={teamPicker.getPlayerName(
							teamPicker.activeDragData.playerId
						)}
					/>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}