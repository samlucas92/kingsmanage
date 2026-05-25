import { useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import type { LineupFormation } from "../../../stores/match";
import { formations } from "./team-picker/Formations";
import { DragOverlayPlayer } from "./team-picker/PlayerCards";
import { FloatingPlayerAssignMenu } from "./team-picker/FloatingPlayerAssignMenu";
import { TeamPitch } from "./team-picker/TeamPitch";
import { TeamBench } from "./team-picker/TeamBench";
import { AvailablePlayersPanel } from "./team-picker/AvailablePlayersPanel";
import { getPositionFitLabel } from "./team-picker/PositionCompatibility";
import type { FormationPosition } from "./team-picker/Types";
import { useTeamPicker } from "./team-picker/useTeamPicker";

interface TeamPickerProps {
	matchId: string;
}

export default function TeamPicker({ matchId }: TeamPickerProps) {
	const teamPicker = useTeamPicker(matchId);
	const [mobilePositionIndex, setMobilePositionIndex] = useState<number | null>(
		null
	);

	if (!teamPicker.match) {
		return (
			<div className="rounded-lg border border-slate-200 bg-white p-4">
				Match not found.
			</div>
		);
	}

	const activePlayerName = teamPicker.activeDragData
		? teamPicker.getPlayerName(teamPicker.activeDragData.playerId)
		: "";

	const activePlayerInitials = activePlayerName
		? teamPicker.getPlayerInitials(activePlayerName)
		: "";

	const activePitchPlayer = teamPicker.activeDragData
		? teamPicker.pitchPlayers.find(
				(player) => player.playerId === teamPicker.activeDragData?.playerId
			)
		: undefined;

	const activeBenchPlayer = teamPicker.activeDragData
		? teamPicker.benchPlayers.find(
				(player) => player.playerId === teamPicker.activeDragData?.playerId
			)
		: undefined;

	const activeOverlayVariant = activePitchPlayer
		? "pitch"
		: activeBenchPlayer
			? "bench"
			: "available";

	const selectedFormation = formations[teamPicker.selectedFormation];

	function handleOpenMobilePositionSelector(positionIndex: number) {
		if (teamPicker.isLineupLocked) {
			return;
		}

		const occupant = teamPicker.getPositionOccupant(positionIndex);

		if (occupant) {
			return;
		}

		setMobilePositionIndex(positionIndex);
	}

	function handleAssignMobilePlayer(playerId: string) {
		if (mobilePositionIndex === null) {
			return;
		}

		teamPicker.assignPlayerToPosition(playerId, mobilePositionIndex);
		setMobilePositionIndex(null);
	}

	return (
		<DndContext
			onDragStart={teamPicker.handleDragStart}
			onDragMove={teamPicker.handleDragMove}
			onDragEnd={teamPicker.handleDragEnd}
			onDragCancel={teamPicker.handleDragCancel}
		>
			<div className="grid min-w-0 items-start gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
				<div className="hidden min-w-0 xl:block xl:sticky xl:top-0">
					<AvailablePlayersPanel
						availablePlayers={teamPicker.availablePlayers}
						isLineupLocked={teamPicker.isLineupLocked}
						openMenuPlayerId={teamPicker.openMenu?.playerId}
						hoveredSwapTargetPlayerId={teamPicker.hoveredSwapTargetPlayerId}
						onOpenPlayerMenu={teamPicker.openPlayerMenu}
					/>
				</div>

				<div className="min-w-0 space-y-4">
					<div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="min-w-0">
							<h3 className="text-sm font-semibold text-slate-900">
								Starting XI
							</h3>

							<p className="text-xs text-slate-500">
								{teamPicker.isLineupLocked
									? "This team is saved and locked."
									: "On mobile, tap an empty position to choose a player."}
							</p>
						</div>

						<div className="flex min-w-0 flex-wrap items-center gap-2">
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

					<div className="xl:hidden rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
						Tap an empty shirt position to choose a player. Tap a selected player
						to move them, bench them, or remove them.
					</div>

					<div className="min-w-0 overflow-x-auto pb-1">
						<div className="min-w-[320px]">
							<TeamPitch
								pitchRef={teamPicker.pitchRef}
								isOverPitch={teamPicker.isOverPitch}
								formation={selectedFormation}
								hoveredFormationIndex={teamPicker.hoveredFormationIndex}
								hoveredSwapTargetPlayerId={teamPicker.hoveredSwapTargetPlayerId}
								pitchPlayers={teamPicker.pitchPlayers}
								isLineupLocked={teamPicker.isLineupLocked}
								openMenuPlayerId={teamPicker.openMenu?.playerId}
								getPositionOccupant={teamPicker.getPositionOccupant}
								getPlayerName={teamPicker.getPlayerName}
								getPlayerPositions={teamPicker.getPlayerPositions}
								getPlayerInitials={teamPicker.getPlayerInitials}
								onOpenPlayerMenu={teamPicker.openPlayerMenu}
								onOpenMobilePositionSelector={
									handleOpenMobilePositionSelector
								}
							/>
						</div>
					</div>

					<TeamBench
						benchRef={teamPicker.benchRef}
						isOverBench={teamPicker.isOverBench}
						hoveredSwapTargetPlayerId={teamPicker.hoveredSwapTargetPlayerId}
						benchPlayers={teamPicker.benchPlayers}
						isLineupLocked={teamPicker.isLineupLocked}
						openMenuPlayerId={teamPicker.openMenu?.playerId}
						getPlayerName={teamPicker.getPlayerName}
						onOpenPlayerMenu={teamPicker.openPlayerMenu}
					/>

					<div className="hidden xl:block">
						<p className="text-xs text-slate-500">
							Drag available players onto the pitch or bench, or tap a player to
							assign them manually.
						</p>
					</div>
				</div>
			</div>

			{mobilePositionIndex !== null && (
				<MobilePositionPlayerSelector
					positionIndex={mobilePositionIndex}
					position={selectedFormation[mobilePositionIndex]}
					availablePlayers={teamPicker.availablePlayers}
					getPlayerPositions={teamPicker.getPlayerPositions}
					onClose={() => setMobilePositionIndex(null)}
					onSelectPlayer={handleAssignMobilePlayer}
				/>
			)}

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
						formation={selectedFormation}
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

			<DragOverlay dropAnimation={null}>
				{teamPicker.activeDragData ? (
					<DragOverlayPlayer
						name={activePlayerName}
						initials={activePlayerInitials}
						variant={activeOverlayVariant}
					/>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}

function MobilePositionPlayerSelector({
	positionIndex,
	position,
	availablePlayers,
	getPlayerPositions,
	onClose,
	onSelectPlayer,
}: {
	positionIndex: number;
	position: FormationPosition;
	availablePlayers: {
		id: string;
		name: string;
		isActive: boolean;
	}[];
	getPlayerPositions: (playerId: string) => string[];
	onClose: () => void;
	onSelectPlayer: (playerId: string) => void;
}) {
	const sortedPlayers = [...availablePlayers].sort((firstPlayer, secondPlayer) => {
		const firstFit = getPositionFitLabel(
			getPlayerPositions(firstPlayer.id),
			position.label
		);
		const secondFit = getPositionFitLabel(
			getPlayerPositions(secondPlayer.id),
			position.label
		);

		const firstScore = getFitScore(firstFit);
		const secondScore = getFitScore(secondFit);

		if (secondScore !== firstScore) {
			return secondScore - firstScore;
		}

		return firstPlayer.name.localeCompare(secondPlayer.name);
	});

	return (
		<div className="fixed inset-0 z-50 xl:hidden">
			<button
				type="button"
				className="absolute inset-0 bg-black/40"
				onClick={onClose}
				aria-label="Close player selector"
			/>

			<div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-hidden rounded-t-2xl bg-white shadow-2xl">
				<div className="border-b border-slate-200 p-4">
					<div className="flex items-start justify-between gap-3">
						<div>
							<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
								Choose player
							</p>

							<h3 className="mt-1 text-lg font-bold text-blue-900">
								{position.label}
							</h3>

							<p className="mt-1 text-sm text-slate-500">
								Position {positionIndex + 1} · {availablePlayers.length} players
								available
							</p>
						</div>

						<button
							type="button"
							onClick={onClose}
							className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
						>
							Close
						</button>
					</div>
				</div>

				<div className="max-h-[60vh] overflow-y-auto p-4">
					{sortedPlayers.length === 0 ? (
						<p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
							No available players left. Remove someone from the pitch or bench
							first.
						</p>
					) : (
						<div className="space-y-2">
							{sortedPlayers.map((player) => {
								const playerPositions = getPlayerPositions(player.id);
								const fitLabel = getPositionFitLabel(
									playerPositions,
									position.label
								);

								return (
									<button
										key={player.id}
										type="button"
										onClick={() => onSelectPlayer(player.id)}
										className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:bg-slate-50"
									>
										<div className="min-w-0">
											<p className="truncate font-semibold text-slate-900">
												{player.name}
											</p>

											<p className="mt-0.5 truncate text-xs text-slate-500">
												{playerPositions.length > 0
													? playerPositions.join(", ")
													: "No preferred positions"}
											</p>
										</div>

										<span
											className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${getFitClass(
												fitLabel
											)}`}
										>
											{fitLabel}
										</span>
									</button>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function getFitScore(fitLabel: string) {
	if (fitLabel === "Natural") {
		return 3;
	}

	if (fitLabel === "Can play") {
		return 2;
	}

	if (fitLabel === "Emergency") {
		return 1;
	}

	return 0;
}

function getFitClass(fitLabel: string) {
	if (fitLabel === "Natural") {
		return "bg-blue-100 text-blue-800";
	}

	if (fitLabel === "Can play") {
		return "bg-green-100 text-green-800";
	}

	if (fitLabel === "Emergency") {
		return "bg-amber-100 text-amber-800";
	}

	return "bg-slate-100 text-slate-600";
}