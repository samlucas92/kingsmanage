import { useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
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

type MobilePlayerSelectorMode =
	| {
			type: "position";
			positionIndex: number;
	  }
	| {
			type: "bench";
	  }
	| {
			type: "replace";
			targetPlayerId: string;
			targetPlayerName: string;
			targetArea: "pitch" | "bench";
			positionIndex?: number;
	  };

export default function TeamPicker({ matchId }: TeamPickerProps) {
	const teamPicker = useTeamPicker(matchId);

	const [mobilePlayerSelectorMode, setMobilePlayerSelectorMode] =
		useState<MobilePlayerSelectorMode | null>(null);

	if (!teamPicker.match) {
		return (
			<div className="rounded-lg border border-slate-200 bg-white p-4">
				Match not found.
			</div>
		);
	}

	const selectedFormation = teamPicker.formations[teamPicker.selectedFormation];

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

	const mobileSelectedPlayerId = teamPicker.openMenu?.playerId;
	const mobileSelectedPlayerName = mobileSelectedPlayerId
		? teamPicker.getPlayerName(mobileSelectedPlayerId)
		: "";

	const mobileSelectedPitchPlayer = mobileSelectedPlayerId
		? teamPicker.pitchPlayers.find(
				(player) => player.playerId === mobileSelectedPlayerId
			)
		: undefined;

	const mobileSelectedBenchPlayer = mobileSelectedPlayerId
		? teamPicker.benchPlayers.find(
				(player) => player.playerId === mobileSelectedPlayerId
			)
		: undefined;

	function closeMobilePlayerSelector() {
		setMobilePlayerSelectorMode(null);
	}

	function openMobilePositionSelector(positionIndex: number) {
		if (teamPicker.isLineupLocked) {
			return;
		}

		const occupant = teamPicker.getPositionOccupant(positionIndex);

		if (occupant) {
			return;
		}

		setMobilePlayerSelectorMode({
			type: "position",
			positionIndex,
		});
	}

	function openMobileBenchSelector() {
		if (teamPicker.isLineupLocked) {
			return;
		}

		setMobilePlayerSelectorMode({
			type: "bench",
		});
	}

	function openMobileReplaceSelector(playerId: string) {
		if (teamPicker.isLineupLocked) {
			return;
		}

		const pitchPlayer = teamPicker.pitchPlayers.find(
			(player) => player.playerId === playerId
		);

		const benchPlayer = teamPicker.benchPlayers.find(
			(player) => player.playerId === playerId
		);

		if (!pitchPlayer && !benchPlayer) {
			return;
		}

		teamPicker.setOpenMenu(null);

		setMobilePlayerSelectorMode({
			type: "replace",
			targetPlayerId: playerId,
			targetPlayerName: teamPicker.getPlayerName(playerId),
			targetArea: pitchPlayer ? "pitch" : "bench",
			positionIndex: pitchPlayer?.positionIndex,
		});
	}

	function handleSelectMobilePlayer(playerId: string) {
		if (!mobilePlayerSelectorMode) {
			return;
		}

		if (mobilePlayerSelectorMode.type === "bench") {
			teamPicker.assignPlayerToBench(playerId);
			closeMobilePlayerSelector();
			return;
		}

		if (mobilePlayerSelectorMode.type === "position") {
			teamPicker.assignPlayerToPosition(
				playerId,
				mobilePlayerSelectorMode.positionIndex
			);
			closeMobilePlayerSelector();
			return;
		}

		teamPicker.removePlayerFromSelection(
			mobilePlayerSelectorMode.targetPlayerId
		);

		if (
			mobilePlayerSelectorMode.targetArea === "pitch" &&
			mobilePlayerSelectorMode.positionIndex !== undefined
		) {
			teamPicker.assignPlayerToPosition(
				playerId,
				mobilePlayerSelectorMode.positionIndex
			);
		} else {
			teamPicker.assignPlayerToBench(playerId);
		}

		closeMobilePlayerSelector();
	}

	function closePlayerActionMenu() {
		teamPicker.setOpenMenu(null);
	}

	return (
		<DndContext
			onDragStart={teamPicker.handleDragStart}
			onDragMove={teamPicker.handleDragMove}
			onDragEnd={teamPicker.handleDragEnd}
			onDragCancel={teamPicker.handleDragCancel}
		>
			<div className="grid min-w-0 items-start gap-4 xl:grid-cols-[320px_minmax(420px,1fr)]">
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
								Starting {teamPicker.sportDefinition.playersPerSide}
							</h3>

							<p className="text-xs text-slate-500">
								{teamPicker.isLineupLocked
									? "This team is saved and locked."
									: "Drag players on desktop, or tap an empty position on mobile."}
							</p>
						</div>

						<div className="flex min-w-0 flex-wrap items-center gap-2">
							{teamPicker.sportDefinition.formations.map((formation) => (
								<button
									key={formation.key}
									type="button"
									onClick={() => teamPicker.applyFormation(formation.key)}
									disabled={teamPicker.isLineupLocked}
									className={`rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
										teamPicker.selectedFormation === formation.key
											? "border-blue-700 bg-blue-700 text-white"
											: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
									}`}
								>
									{formation.name}
								</button>
							))}

							<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
								{teamPicker.pitchPlayers.length}/{teamPicker.sportDefinition.playersPerSide}
							</span>
						</div>
					</div>

					<div className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800 xl:hidden">
						Tap an empty shirt position to choose a player. Tap a selected player
						to move, replace, bench, or remove them.
					</div>

					<div className="min-w-0 overflow-x-auto pb-1">
						<div className="min-w-[320px] xl:min-w-[420px]">
							<TeamPitch
								pitchRef={teamPicker.pitchRef}
								isOverPitch={teamPicker.isOverPitch}
								formation={selectedFormation}
								surface={teamPicker.sportDefinition.surface}
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
								onOpenMobilePositionSelector={openMobilePositionSelector}
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
						onAddSubstitute={openMobileBenchSelector}
					/>

					<div className="hidden xl:block">
						<p className="text-xs text-slate-500">
							Drag available players onto the pitch or bench, or tap a player to
							assign them manually.
						</p>
					</div>
				</div>
			</div>

			{mobilePlayerSelectorMode && (
				<MobilePlayerSelector
					mode={mobilePlayerSelectorMode}
					formation={selectedFormation}
					availablePlayers={teamPicker.availablePlayers}
					getPlayerPositions={teamPicker.getPlayerPositions}
					onClose={closeMobilePlayerSelector}
					onSelectPlayer={handleSelectMobilePlayer}
				/>
			)}

			{teamPicker.openMenu && (
				<>
					<button
						type="button"
						aria-label="Close player menu"
						className="fixed inset-0 z-40 hidden cursor-default bg-transparent xl:block"
						onClick={closePlayerActionMenu}
					/>

					<div className="hidden xl:block">
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
					</div>

					<MobileSelectedPlayerActionSheet
						playerId={teamPicker.openMenu.playerId}
						playerName={mobileSelectedPlayerName}
						formation={selectedFormation}
						pitchPlayers={teamPicker.pitchPlayers}
						getPlayerPositions={teamPicker.getPlayerPositions}
						isPlayerRecommendedForPosition={
							teamPicker.isPlayerRecommendedForPosition
						}
						onClose={closePlayerActionMenu}
						onAssignPosition={(playerId, positionIndex) => {
							teamPicker.assignPlayerToPosition(playerId, positionIndex);
							closePlayerActionMenu();
						}}
						onAssignBench={(playerId) => {
							teamPicker.assignPlayerToBench(playerId);
							closePlayerActionMenu();
						}}
						onReplacePlayer={openMobileReplaceSelector}
						onRemove={(playerId) => {
							teamPicker.removePlayerFromSelection(playerId);
							closePlayerActionMenu();
						}}
						showReplace={Boolean(
							mobileSelectedPitchPlayer || mobileSelectedBenchPlayer
						)}
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

function MobilePlayerSelector({
	mode,
	formation,
	availablePlayers,
	getPlayerPositions,
	onClose,
	onSelectPlayer,
}: {
	mode: MobilePlayerSelectorMode;
	formation: FormationPosition[];
	availablePlayers: {
		id: string;
		name: string;
		isActive: boolean;
	}[];
	getPlayerPositions: (playerId: string) => string[];
	onClose: () => void;
	onSelectPlayer: (playerId: string) => void;
}) {
	const [searchTerm, setSearchTerm] = useState("");

	const position =
		mode.type === "position"
			? formation[mode.positionIndex]
			: mode.type === "replace" && mode.positionIndex !== undefined
				? formation[mode.positionIndex]
				: undefined;

	const filteredPlayers = availablePlayers.filter((player) =>
		player.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const sortedPlayers = [...filteredPlayers].sort((firstPlayer, secondPlayer) => {
		if (!position) {
			return firstPlayer.name.localeCompare(secondPlayer.name);
		}

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

			<div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-hidden rounded-t-2xl bg-white shadow-2xl">
				<div className="border-b border-slate-200 p-4">
					<div className="flex items-start justify-between gap-3">
						<div>
							<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
								Choose player
							</p>

							<h3 className="mt-1 text-lg font-bold text-blue-900">
								{getMobileSelectorTitle(mode, position)}
							</h3>

							<p className="mt-1 text-sm text-slate-500">
								{getMobileSelectorDescription(mode, availablePlayers.length)}
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

					<input
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						placeholder="Search players..."
						className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
					/>
				</div>

				<div className="max-h-[60vh] overflow-y-auto p-4">
					{sortedPlayers.length === 0 ? (
						<p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
							No available players match this search.
						</p>
					) : (
						<div className="space-y-2">
							{sortedPlayers.map((player) => {
								const playerPositions = getPlayerPositions(player.id);
								const fitLabel = position
									? getPositionFitLabel(playerPositions, position.label)
									: "";

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

										{position && (
											<span
												className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${getFitClass(
													fitLabel
												)}`}
											>
												{fitLabel}
											</span>
										)}
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

function MobileSelectedPlayerActionSheet({
	playerId,
	playerName,
	formation,
	pitchPlayers,
	getPlayerPositions,
	isPlayerRecommendedForPosition,
	onClose,
	onAssignPosition,
	onAssignBench,
	onReplacePlayer,
	onRemove,
	showReplace,
	showRemove,
}: {
	playerId: string;
	playerName: string;
	formation: FormationPosition[];
	pitchPlayers: {
		playerId: string;
		positionIndex?: number;
		x?: number;
		y?: number;
		area?: string;
	}[];
	getPlayerPositions: (playerId: string) => string[];
	isPlayerRecommendedForPosition: (
		playerId: string,
		positionLabel: string
	) => boolean;
	onClose: () => void;
	onAssignPosition: (playerId: string, positionIndex: number) => void;
	onAssignBench: (playerId: string) => void;
	onReplacePlayer: (playerId: string) => void;
	onRemove: (playerId: string) => void;
	showReplace: boolean;
	showRemove: boolean;
}) {
	const playerPositions = getPlayerPositions(playerId);

	return (
		<div className="fixed inset-0 z-50 xl:hidden">
			<button
				type="button"
				className="absolute inset-0 bg-black/40"
				onClick={onClose}
				aria-label="Close selected player actions"
			/>

			<div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-hidden rounded-t-2xl bg-white shadow-2xl">
				<div className="border-b border-slate-200 p-4">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
								Player actions
							</p>

							<h3 className="mt-1 truncate text-lg font-bold text-blue-900">
								{playerName}
							</h3>

							<p className="mt-1 truncate text-sm text-slate-500">
								{playerPositions.length > 0
									? playerPositions.join(", ")
									: "No preferred positions"}
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
					<div className="space-y-3">
						{showReplace && (
							<button
								type="button"
								onClick={() => onReplacePlayer(playerId)}
								className="w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-left text-sm font-semibold text-blue-900"
							>
								Replace player
							</button>
						)}

						<button
							type="button"
							onClick={() => onAssignBench(playerId)}
							className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-semibold text-slate-800"
						>
							Move to bench
						</button>

						{showRemove && (
							<button
								type="button"
								onClick={() => onRemove(playerId)}
								className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-left text-sm font-semibold text-red-800"
							>
								Remove from team
							</button>
						)}

						<div>
							<p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
								Move to position
							</p>

							<div className="space-y-2">
								{formation.map((position, index) => {
									const occupant = pitchPlayers.find(
										(pitchPlayer) =>
											pitchPlayer.positionIndex === index &&
											pitchPlayer.playerId !== playerId
									);

									const fitLabel = getPositionFitLabel(
										playerPositions,
										position.label
									);

									return (
										<button
											key={`${position.label}-${index}`}
											type="button"
											onClick={() => onAssignPosition(playerId, index)}
											className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left shadow-sm ${
												occupant
													? "border-amber-200 bg-amber-50"
													: "border-slate-200 bg-white hover:bg-slate-50"
											}`}
										>
											<div>
												<p className="font-semibold text-slate-900">
													{position.label}
												</p>

												<p className="text-xs text-slate-500">
													{occupant ? "Occupied — will swap" : "Available"}
												</p>
											</div>

											<span
												className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${
													isPlayerRecommendedForPosition(
														playerId,
														position.label
													)
														? getFitClass(fitLabel)
														: "bg-slate-100 text-slate-600"
												}`}
											>
												{fitLabel}
											</span>
										</button>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function getMobileSelectorTitle(
	mode: MobilePlayerSelectorMode,
	position?: FormationPosition
) {
	if (mode.type === "bench") {
		return "Add substitute";
	}

	if (mode.type === "replace") {
		return `Replace ${mode.targetPlayerName}`;
	}

	return position?.label ?? "Position";
}

function getMobileSelectorDescription(
	mode: MobilePlayerSelectorMode,
	availablePlayerCount: number
) {
	if (mode.type === "bench") {
		return `${availablePlayerCount} players available`;
	}

	if (mode.type === "replace") {
		return `${availablePlayerCount} replacement options available`;
	}

	return `Position ${mode.positionIndex + 1} · ${availablePlayerCount} players available`;
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
