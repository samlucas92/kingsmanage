import {
	type DragEndEvent,
	type DragMoveEvent,
	type DragStartEvent,
} from "@dnd-kit/core";
import { useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { usePlayerStore } from "../../../../stores/players";
import { useMatchStore } from "../../../../stores/match";
import { useAuthStore } from "../../../../stores/auth";
import { getClubSportDefinition } from "../../../../constants/sports";
import { resolveLineupPosition } from "../../../../utils/lineupPosition";
import type { LineupFormation, SelectedPlayer } from "../../../../stores/match";
import { isPositionCompatible } from "./PositionCompatibility";
import type { DragData, DropData, OpenPlayerMenu } from "./Types";

const MENU_WIDTH = 240;
const MENU_MAX_HEIGHT = 300;
const PITCH_PLAYER_TARGET_RADIUS = 5.5;
const PITCH_PLAYER_TARGET_RADIUS_WHEN_FULL = 8;

type ScreenPoint = {
	x: number;
	y: number;
};

type PitchPosition = {
	x: number;
	y: number;
};

type FormationCandidate = {
	x: number;
	y: number;
	positionIndex: number;
	distance: number;
};

type PitchPlayerCandidate = {
	playerId: string;
	distance: number;
};

export function useTeamPicker(matchId: string) {
	const pitchRef = useRef<HTMLDivElement | null>(null);
	const benchRef = useRef<HTMLDivElement | null>(null);
	const dragStartPointerRef = useRef<ScreenPoint | null>(null);

	const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
	const [isOverPitch, setIsOverPitch] = useState(false);
	const [isOverBench, setIsOverBench] = useState(false);
	const [hoveredFormationIndex, setHoveredFormationIndex] = useState<
		number | null
	>(null);
	const [hoveredSwapTargetPlayerId, setHoveredSwapTargetPlayerId] = useState<
		string | null
	>(null);
	const [openMenu, setOpenMenu] = useState<OpenPlayerMenu | null>(null);

	const players = usePlayerStore((state) => state.players);
	const availableClubs = useAuthStore((state) => state.availableClubs);
	const activeClub = availableClubs.find((club) => club.isCurrent);
	const sportDefinition = getClubSportDefinition(
		activeClub?.sportKey,
		activeClub?.customFormations
	);
	const sportFormations = Object.fromEntries(
		sportDefinition.formations.map((formation) => [
			formation.key,
			formation.slots,
		])
	);

	const match = useMatchStore((state) =>
		state.matches.find((match) => match.id === matchId)
	);

	const setSelectedPlayers = useMatchStore(
		(state) => state.setSelectedPlayers
	);

	const setLineupFormation = useMatchStore(
		(state) => state.setLineupFormation
	);

	const removeSelectedPlayer = useMatchStore(
		(state) => state.removeSelectedPlayer
	);

	function getPlayerName(playerId: string) {
		const player = players.find((player) => player.id === playerId);
		return player?.name ?? "Unknown player";
	}

	function getPlayerPositions(playerId: string) {
		const player = players.find((player) => player.id === playerId);
		return player?.positions ?? [];
	}

	function getPlayerNumber(playerId: string) {
		const player = players.find((player) => player.id === playerId);
		return player?.number;
	}

	function isPlayerRecommendedForPosition(
		playerId: string,
		positionLabel: string
	) {
		const playerPositions = getPlayerPositions(playerId);

		return isPositionCompatible(playerPositions, positionLabel);
	}

	function getPlayerInitials(name: string) {
		const parts = name.trim().split(/\s+/);

		if (parts.length === 0) {
			return "?";
		}

		if (parts.length === 1) {
			return parts[0].slice(0, 2).toUpperCase();
		}

		return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
	}

	if (!match) {
		return {
			match: undefined,
			pitchRef,
			benchRef,
			activeDragData,
			isOverPitch,
			isOverBench,
			hoveredFormationIndex,
			hoveredSwapTargetPlayerId,
			openMenu,
			selectedFormation: "4-4-2" as LineupFormation,
			isLineupLocked: false,
			availablePlayers: [],
			pitchPlayers: [],
			benchPlayers: [],
			openMenuPlayerIsSelected: false,
			getPlayerName,
			getPlayerPositions,
			isPlayerRecommendedForPosition,
			getPlayerInitials,
			getPositionOccupant,
			openPlayerMenu,
			assignPlayerToPosition,
			assignPlayerToBench,
			removePlayerFromSelection,
			applyFormation,
			setOpenMenu,
			handleDragStart,
			handleDragMove,
			handleDragEnd,
			handleDragCancel,
		};
	}

	const currentMatch = match;
	const selectedFormation = sportFormations[currentMatch.selectedFormation]
		? currentMatch.selectedFormation
		: sportDefinition.formations[0].key;
	const isLineupLocked = currentMatch.isLineupLocked;
	function resolvePitchPosition(player: SelectedPlayer) {
		return resolveLineupPosition(player, sportFormations[selectedFormation]);
	}

	const allActivePlayers = players.filter((player) => player.isActive);

	const selectedPlayerIds = currentMatch.selectedPlayers.map(
		(selectedPlayer) => selectedPlayer.playerId
	);

	const availablePlayers = allActivePlayers.filter(
		(player) => !selectedPlayerIds.includes(player.id)
	);

	const pitchPlayers = currentMatch.selectedPlayers.filter(
		(selectedPlayer) => selectedPlayer.area === "pitch"
	);

	const benchPlayers = currentMatch.selectedPlayers.filter(
		(selectedPlayer) => selectedPlayer.area === "bench"
	);

	const openMenuPlayerIsSelected = openMenu
		? selectedPlayerIds.includes(openMenu.playerId)
		: false;

	function getPositionOccupant(positionIndex: number) {
		return pitchPlayers.find(
			(pitchPlayer) => pitchPlayer.positionIndex === positionIndex
		);
	}

	function getSelectedPlayer(playerId: string) {
		return currentMatch.selectedPlayers.find(
			(selectedPlayer) => selectedPlayer.playerId === playerId
		);
	}

	function getPitchPlayer(playerId: string) {
		const selectedPlayer = getSelectedPlayer(playerId);

		if (!selectedPlayer || selectedPlayer.area !== "pitch") {
			return null;
		}

		return selectedPlayer;
	}

	function getPointerFromEvent(event: Event): ScreenPoint | null {
		if (event instanceof MouseEvent || event instanceof PointerEvent) {
			return {
				x: event.clientX,
				y: event.clientY,
			};
		}

		if (event instanceof TouchEvent) {
			const touch = event.touches[0] ?? event.changedTouches[0];

			if (!touch) {
				return null;
			}

			return {
				x: touch.clientX,
				y: touch.clientY,
			};
		}

		return null;
	}

	function isPointInsideRect(point: ScreenPoint, rect: DOMRect) {
		return (
			point.x >= rect.left &&
			point.x <= rect.right &&
			point.y >= rect.top &&
			point.y <= rect.bottom
		);
	}

	function getDragPoint(event: DragEndEvent | DragMoveEvent): ScreenPoint | null {
		if (dragStartPointerRef.current) {
			return {
				x: dragStartPointerRef.current.x + event.delta.x,
				y: dragStartPointerRef.current.y + event.delta.y,
			};
		}

		const activeRect = event.active.rect.current.initial;

		if (!activeRect) {
			return null;
		}

		return {
			x: activeRect.left + event.delta.x + activeRect.width / 2,
			y: activeRect.top + event.delta.y + activeRect.height / 2,
		};
	}

	function getPitchPosition(point: ScreenPoint) {
		const pitchElement = pitchRef.current;

		if (!pitchElement) {
			return null;
		}

		const pitchRect = pitchElement.getBoundingClientRect();

		const x = ((point.x - pitchRect.left) / pitchRect.width) * 100;
		const y = ((point.y - pitchRect.top) / pitchRect.height) * 100;

		return {
			x: Math.min(100, Math.max(0, x)),
			y: Math.min(100, Math.max(0, y)),
		};
	}

	function getDropTarget(event: DragEndEvent | DragMoveEvent) {
		const dropData = event.over?.data.current as DropData | undefined;

		if (!dropData || dropData.type !== "player") {
			return null;
		}

		return dropData;
	}

	function getDistance(
		firstPoint: PitchPosition,
		secondPoint: PitchPosition
	) {
		const distanceX = firstPoint.x - secondPoint.x;
		const distanceY = firstPoint.y - secondPoint.y;

		return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
	}

	function getClosestAvailableFormationCandidate(
		pitchPosition: PitchPosition,
		playerId: string
	): FormationCandidate | null {
		const formation = sportFormations[selectedFormation];
		const occupiedIndexes = new Set<number>();

		for (const pitchPlayer of pitchPlayers) {
			if (pitchPlayer.playerId === playerId) {
				continue;
			}

			if (pitchPlayer.positionIndex !== undefined) {
				occupiedIndexes.add(pitchPlayer.positionIndex);
				continue;
			}

			const occupiedIndex = formation.findIndex((position) => {
				const distance = getDistance(position, resolvePitchPosition(pitchPlayer));

				return distance <= 4;
			});

			if (occupiedIndex >= 0) {
				occupiedIndexes.add(occupiedIndex);
			}
		}

		let closestCandidate: FormationCandidate | null = null;

		formation.forEach((position, positionIndex) => {
			if (occupiedIndexes.has(positionIndex)) {
				return;
			}

			const distance = getDistance(position, pitchPosition);

			if (!closestCandidate || distance < closestCandidate.distance) {
				closestCandidate = {
					x: position.x,
					y: position.y,
					positionIndex,
					distance,
				};
			}
		});

		return closestCandidate;
	}

	function getPitchPlayerCandidateFromDropTarget(
		pitchPosition: PitchPosition,
		dropTarget: DropData | null,
		playerId: string
	): PitchPlayerCandidate | null {
		if (
			!dropTarget ||
			dropTarget.area !== "pitch" ||
			dropTarget.playerId === playerId
		) {
			return null;
		}

		const targetPlayer = getPitchPlayer(dropTarget.playerId);

		if (!targetPlayer) {
			return null;
		}

		return {
			playerId: targetPlayer.playerId,
			distance: getDistance(pitchPosition, resolvePitchPosition(targetPlayer)),
		};
	}

	function getPitchPlayerCandidateFromPosition(
		pitchPosition: PitchPosition,
		playerId: string
	): PitchPlayerCandidate | null {
		let closestCandidate: PitchPlayerCandidate | null = null;

		for (const pitchPlayer of pitchPlayers) {
			if (pitchPlayer.playerId === playerId) {
				continue;
			}

			const distance = getDistance(pitchPosition, resolvePitchPosition(pitchPlayer));

			if (
				distance <= PITCH_PLAYER_TARGET_RADIUS &&
				(!closestCandidate || distance < closestCandidate.distance)
			) {
				closestCandidate = {
					playerId: pitchPlayer.playerId,
					distance,
				};
			}
		}

		return closestCandidate;
	}

	function getPitchPlayerCandidate(
		pitchPosition: PitchPosition,
		dropTarget: DropData | null,
		playerId: string
	) {
		const targetFromDropTarget = getPitchPlayerCandidateFromDropTarget(
			pitchPosition,
			dropTarget,
			playerId
		);

		const targetFromPosition = getPitchPlayerCandidateFromPosition(
			pitchPosition,
			playerId
		);

		if (!targetFromDropTarget) {
			return targetFromPosition;
		}

		if (!targetFromPosition) {
			return targetFromDropTarget;
		}

		return targetFromDropTarget.distance <= targetFromPosition.distance
			? targetFromDropTarget
			: targetFromPosition;
	}

	function shouldUsePitchPlayerCandidate(
		pitchPlayerCandidate: PitchPlayerCandidate | null,
		formationCandidate: FormationCandidate | null
	) {
		if (!pitchPlayerCandidate) {
			return false;
		}

		if (!formationCandidate) {
			return pitchPlayerCandidate.distance <= PITCH_PLAYER_TARGET_RADIUS_WHEN_FULL;
		}

		return (
			pitchPlayerCandidate.distance <= PITCH_PLAYER_TARGET_RADIUS &&
			pitchPlayerCandidate.distance <= formationCandidate.distance
		);
	}

	function replaceOrAddSelectedPlayer(nextSelectedPlayer: SelectedPlayer) {
		if (isLineupLocked) {
			return;
		}

		const alreadySelected = currentMatch.selectedPlayers.some(
			(selectedPlayer) =>
				selectedPlayer.playerId === nextSelectedPlayer.playerId
		);

		if (alreadySelected) {
			setSelectedPlayers(
				matchId,
				currentMatch.selectedPlayers.map((selectedPlayer) =>
					selectedPlayer.playerId === nextSelectedPlayer.playerId
						? nextSelectedPlayer
						: selectedPlayer
				)
			);

			return;
		}

		setSelectedPlayers(matchId, [
			...currentMatch.selectedPlayers,
			nextSelectedPlayer,
		]);
	}

	function movePlayerToBenchInList(
		selectedPlayers: SelectedPlayer[],
		playerId: string
	) {
		const alreadySelected = selectedPlayers.some(
			(selectedPlayer) => selectedPlayer.playerId === playerId
		);

		if (alreadySelected) {
			return selectedPlayers.map((selectedPlayer) =>
				selectedPlayer.playerId === playerId
					? {
							...selectedPlayer,
							x: 0,
							y: 0,
							area: "bench" as const,
							positionKey: undefined,
							positionIndex: undefined,
						}
					: selectedPlayer
			);
		}

		return [
			...selectedPlayers,
			{
				playerId,
				x: 0,
				y: 0,
				area: "bench" as const,
				positionIndex: undefined,
				positionKey: undefined,
			},
		];
	}

	function removeSelectedPlayerFromList(
		selectedPlayers: SelectedPlayer[],
		playerId: string
	) {
		return selectedPlayers.filter(
			(selectedPlayer) => selectedPlayer.playerId !== playerId
		);
	}

	function movePlayerToPitchInList(
		selectedPlayers: SelectedPlayer[],
		playerId: string,
		position: Pick<SelectedPlayer, "x" | "y" | "positionIndex" | "positionKey">
	) {
		const alreadySelected = selectedPlayers.some(
			(selectedPlayer) => selectedPlayer.playerId === playerId
		);

		if (alreadySelected) {
			return selectedPlayers.map((selectedPlayer) =>
				selectedPlayer.playerId === playerId
					? {
							...selectedPlayer,
							x: position.positionKey ? undefined : position.x,
							y: position.positionKey ? undefined : position.y,
							area: "pitch" as const,
							positionIndex: position.positionIndex,
							positionKey: position.positionKey,
						}
					: selectedPlayer
			);
		}

		return [
			...selectedPlayers,
			{
				playerId,
				x: position.positionKey ? undefined : position.x,
				y: position.positionKey ? undefined : position.y,
				area: "pitch" as const,
				positionIndex: position.positionIndex,
				positionKey: position.positionKey,
			},
		];
	}

	function dropPlayerOnPitchPlayer(playerId: string, targetPlayerId: string) {
		if (isLineupLocked || playerId === targetPlayerId) {
			return;
		}

		const draggedPlayer = getSelectedPlayer(playerId);
		const targetPlayer = getSelectedPlayer(targetPlayerId);

		if (!targetPlayer || targetPlayer.area !== "pitch") {
			return;
		}

		const targetPitchPosition = {
			...resolvePitchPosition(targetPlayer),
			positionIndex: targetPlayer.positionIndex,
			positionKey: targetPlayer.positionKey,
		};

		if (draggedPlayer?.area === "pitch") {
			const draggedPitchPosition = {
				...resolvePitchPosition(draggedPlayer),
				positionIndex: draggedPlayer.positionIndex,
				positionKey: draggedPlayer.positionKey,
			};

			const updatedSelectedPlayers = currentMatch.selectedPlayers.map(
				(selectedPlayer) => {
					if (selectedPlayer.playerId === playerId) {
						return {
							...selectedPlayer,
							...targetPitchPosition,
						};
					}

					if (selectedPlayer.playerId === targetPlayerId) {
						return {
							...selectedPlayer,
							...draggedPitchPosition,
						};
					}

					return selectedPlayer;
				}
			);

			setSelectedPlayers(matchId, updatedSelectedPlayers);
			return;
		}

		if (draggedPlayer?.area === "bench") {
			let updatedSelectedPlayers = movePlayerToPitchInList(
				currentMatch.selectedPlayers,
				playerId,
				targetPitchPosition
			);

			updatedSelectedPlayers = movePlayerToBenchInList(
				updatedSelectedPlayers,
				targetPlayerId
			);

			setSelectedPlayers(matchId, updatedSelectedPlayers);
			return;
		}

		let updatedSelectedPlayers = movePlayerToPitchInList(
			currentMatch.selectedPlayers,
			playerId,
			targetPitchPosition
		);

		updatedSelectedPlayers = removeSelectedPlayerFromList(
			updatedSelectedPlayers,
			targetPlayerId
		);

		setSelectedPlayers(matchId, updatedSelectedPlayers);
	}

	function dropPlayerOnBenchPlayer(playerId: string, targetPlayerId: string) {
		if (isLineupLocked || playerId === targetPlayerId) {
			return;
		}

		const draggedPlayer = getSelectedPlayer(playerId);
		const targetPlayer = getSelectedPlayer(targetPlayerId);

		if (!targetPlayer || targetPlayer.area !== "bench") {
			return;
		}

		if (draggedPlayer?.area === "pitch") {
			const draggedPitchPosition = {
				x: draggedPlayer.x,
				y: draggedPlayer.y,
				positionIndex: draggedPlayer.positionIndex,
			};

			let updatedSelectedPlayers = movePlayerToPitchInList(
				currentMatch.selectedPlayers,
				targetPlayerId,
				draggedPitchPosition
			);

			updatedSelectedPlayers = movePlayerToBenchInList(
				updatedSelectedPlayers,
				playerId
			);

			setSelectedPlayers(matchId, updatedSelectedPlayers);
			return;
		}

		if (!draggedPlayer) {
			let updatedSelectedPlayers = movePlayerToBenchInList(
				currentMatch.selectedPlayers,
				playerId
			);

			updatedSelectedPlayers = removeSelectedPlayerFromList(
				updatedSelectedPlayers,
				targetPlayerId
			);

			setSelectedPlayers(matchId, updatedSelectedPlayers);
			return;
		}

		assignPlayerToBench(playerId);
	}

	function dropPlayerOnAvailablePlayer(playerId: string, targetPlayerId: string) {
		if (isLineupLocked || playerId === targetPlayerId) {
			return;
		}

		const draggedPlayer = getSelectedPlayer(playerId);

		if (draggedPlayer?.area === "pitch") {
			const draggedPitchPosition = {
				x: draggedPlayer.x,
				y: draggedPlayer.y,
				positionIndex: draggedPlayer.positionIndex,
			};

			let updatedSelectedPlayers = removeSelectedPlayerFromList(
				currentMatch.selectedPlayers,
				playerId
			);

			updatedSelectedPlayers = movePlayerToPitchInList(
				updatedSelectedPlayers,
				targetPlayerId,
				draggedPitchPosition
			);

			setSelectedPlayers(matchId, updatedSelectedPlayers);
			return;
		}

		if (draggedPlayer?.area === "bench") {
			let updatedSelectedPlayers = removeSelectedPlayerFromList(
				currentMatch.selectedPlayers,
				playerId
			);

			updatedSelectedPlayers = movePlayerToBenchInList(
				updatedSelectedPlayers,
				targetPlayerId
			);

			setSelectedPlayers(matchId, updatedSelectedPlayers);
		}
	}

	function assignPlayerToPosition(playerId: string, positionIndex: number) {
		if (isLineupLocked) {
			return;
		}

		const position = sportFormations[selectedFormation][positionIndex];

		const occupiedByOtherPlayer = pitchPlayers.some(
			(pitchPlayer) =>
				pitchPlayer.playerId !== playerId &&
				pitchPlayer.positionIndex === positionIndex
		);

		if (occupiedByOtherPlayer) {
			return;
		}

		replaceOrAddSelectedPlayer({
			playerId,
			area: "pitch",
			positionKey: position.key,
			positionIndex,
		});

		setOpenMenu(null);
	}

	function assignPlayerToBench(playerId: string) {
		if (isLineupLocked) {
			return;
		}

		replaceOrAddSelectedPlayer({
			playerId,
			area: "bench",
			positionKey: undefined,
			positionIndex: undefined,
		});

		setOpenMenu(null);
	}

	function removePlayerFromSelection(playerId: string) {
		if (isLineupLocked) {
			return;
		}

		removeSelectedPlayer(matchId, playerId);
		setOpenMenu(null);
	}

	function applyFormation(formationName: LineupFormation) {
		if (isLineupLocked) {
			return;
		}

		setLineupFormation(matchId, formationName);

		const formation = sportFormations[formationName];

		const pitchSelectedPlayers = currentMatch.selectedPlayers.filter(
			(selectedPlayer) => selectedPlayer.area === "pitch"
		);

		const updatedSelectedPlayers = currentMatch.selectedPlayers.map(
			(selectedPlayer) => {
				if (selectedPlayer.area !== "pitch") {
					return {
						...selectedPlayer,
						positionIndex: undefined,
						positionKey: undefined,
					};
				}

				const pitchPlayerIndex = pitchSelectedPlayers.findIndex(
					(pitchPlayer) => pitchPlayer.playerId === selectedPlayer.playerId
				);

				const formationPosition = formation[pitchPlayerIndex];

				if (!formationPosition) {
					return {
						...selectedPlayer,
						area: "bench" as const,
						positionIndex: undefined,
						positionKey: undefined,
					};
				}

				return {
					...selectedPlayer,
					x: undefined,
					y: undefined,
					positionKey: formationPosition.key,
					positionIndex: pitchPlayerIndex,
				};
			}
		);

		setSelectedPlayers(matchId, updatedSelectedPlayers);
		setOpenMenu(null);
	}

	function openPlayerMenu(
		playerId: string,
		event: ReactMouseEvent<HTMLButtonElement>
	) {
		if (isLineupLocked) {
			return;
		}

		event.stopPropagation();

		const rect = event.currentTarget.getBoundingClientRect();

		const left = Math.min(rect.left, window.innerWidth - MENU_WIDTH - 16);
		const top = Math.min(
			rect.bottom + 8,
			window.innerHeight - MENU_MAX_HEIGHT - 16
		);

		setOpenMenu((currentMenu) =>
			currentMenu?.playerId === playerId
				? null
				: {
						playerId,
						left: Math.max(16, left),
						top: Math.max(16, top),
					}
		);
	}

	function handleDragStart(event: DragStartEvent) {
		if (isLineupLocked) {
			return;
		}

		const dragData = event.active.data.current as DragData | undefined;

		if (!dragData) {
			return;
		}

		dragStartPointerRef.current = getPointerFromEvent(event.activatorEvent);

		setOpenMenu(null);
		setActiveDragData(dragData);
	}

	function handleDragMove(event: DragMoveEvent) {
		if (isLineupLocked) {
			return;
		}

		const dragData = event.active.data.current as DragData | undefined;
		const point = getDragPoint(event);

		if (!point || !dragData) {
			return;
		}

		const pitchRect = pitchRef.current?.getBoundingClientRect();
		const benchRect = benchRef.current?.getBoundingClientRect();
		const dropTarget = getDropTarget(event);

		const overPitch = pitchRect ? isPointInsideRect(point, pitchRect) : false;
		const overBench = benchRect ? isPointInsideRect(point, benchRect) : false;

		setIsOverPitch(overPitch);
		setIsOverBench(overBench);

		if (overPitch) {
			const pitchPosition = getPitchPosition(point);

			if (!pitchPosition) {
				setHoveredFormationIndex(null);
				setHoveredSwapTargetPlayerId(null);
				return;
			}

			const formationCandidate = getClosestAvailableFormationCandidate(
				pitchPosition,
				dragData.playerId
			);

			const pitchPlayerCandidate = getPitchPlayerCandidate(
				pitchPosition,
				dropTarget,
				dragData.playerId
			);

			if (
				shouldUsePitchPlayerCandidate(
					pitchPlayerCandidate,
					formationCandidate
				)
			) {
				setHoveredSwapTargetPlayerId(pitchPlayerCandidate?.playerId ?? null);
				setHoveredFormationIndex(null);
				return;
			}

			setHoveredSwapTargetPlayerId(null);
			setHoveredFormationIndex(formationCandidate?.positionIndex ?? null);
			return;
		}

		const validDropTarget =
			dropTarget && dropTarget.playerId !== dragData.playerId
				? dropTarget
				: null;

		setHoveredSwapTargetPlayerId(validDropTarget?.playerId ?? null);
		setHoveredFormationIndex(null);
	}

	function resetDragState() {
		dragStartPointerRef.current = null;
		setActiveDragData(null);
		setIsOverPitch(false);
		setIsOverBench(false);
		setHoveredFormationIndex(null);
		setHoveredSwapTargetPlayerId(null);
	}

	function handleDragCancel() {
		resetDragState();
	}

	function handleDragEnd(event: DragEndEvent) {
		if (isLineupLocked) {
			resetDragState();
			return;
		}

		const dragData = event.active.data.current as DragData | undefined;
		const point = getDragPoint(event);
		const dropTarget = getDropTarget(event);

		resetDragState();

		if (!dragData || !point) {
			return;
		}

		const playerId = dragData.playerId;

		const pitchRect = pitchRef.current?.getBoundingClientRect();
		const benchRect = benchRef.current?.getBoundingClientRect();

		const droppedOnPitch = pitchRect
			? isPointInsideRect(point, pitchRect)
			: false;

		const droppedOnBench = benchRect
			? isPointInsideRect(point, benchRect)
			: false;

		if (droppedOnPitch) {
			const pitchPosition = getPitchPosition(point);

			if (!pitchPosition) {
				return;
			}

			const formationCandidate = getClosestAvailableFormationCandidate(
				pitchPosition,
				playerId
			);

			const pitchPlayerCandidate = getPitchPlayerCandidate(
				pitchPosition,
				dropTarget,
				playerId
			);

			if (
				shouldUsePitchPlayerCandidate(
					pitchPlayerCandidate,
					formationCandidate
				)
			) {
				if (pitchPlayerCandidate) {
					dropPlayerOnPitchPlayer(playerId, pitchPlayerCandidate.playerId);
				}

				return;
			}

			if (!formationCandidate) {
				return;
			}

			assignPlayerToPosition(playerId, formationCandidate.positionIndex);
			return;
		}

		if (dropTarget && dropTarget.playerId !== playerId) {
			if (dropTarget.area === "bench") {
				dropPlayerOnBenchPlayer(playerId, dropTarget.playerId);
				return;
			}

			if (dropTarget.area === "available") {
				dropPlayerOnAvailablePlayer(playerId, dropTarget.playerId);
				return;
			}

			if (dropTarget.area === "pitch") {
				dropPlayerOnPitchPlayer(playerId, dropTarget.playerId);
				return;
			}
		}

		if (droppedOnBench) {
			assignPlayerToBench(playerId);
		}
	}

	return {
		match: currentMatch,
		pitchRef,
		benchRef,
		activeDragData,
		isOverPitch,
		isOverBench,
		hoveredFormationIndex,
		hoveredSwapTargetPlayerId,
		openMenu,
		selectedFormation,
		sportDefinition,
		formations: sportFormations,
		isLineupLocked,
		availablePlayers,
		pitchPlayers,
		benchPlayers,
		openMenuPlayerIsSelected,
		getPlayerName,
		getPlayerNumber,
		getPlayerPositions,
		isPlayerRecommendedForPosition,
		getPlayerInitials,
		getPositionOccupant,
		openPlayerMenu,
		assignPlayerToPosition,
		assignPlayerToBench,
		removePlayerFromSelection,
		applyFormation,
		setOpenMenu,
		handleDragStart,
		handleDragMove,
		handleDragEnd,
		handleDragCancel,
	};
}
