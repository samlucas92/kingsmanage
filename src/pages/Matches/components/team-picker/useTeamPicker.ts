import {
	type DragEndEvent,
	type DragMoveEvent,
	type DragStartEvent,
} from "@dnd-kit/core";
import { useRef, useState, type MouseEvent } from "react";
import { usePlayerStore } from "../../../../stores/players";
import { useMatchStore } from "../../../../stores/match";
import type { LineupFormation, SelectedPlayer } from "../../../../stores/match";
import { formations } from "./Formations";
import { isPositionCompatible } from "./PositionCompatibility";
import type { DragData, OpenPlayerMenu } from "./Types";

const MENU_WIDTH = 240;
const MENU_MAX_HEIGHT = 300;

export function useTeamPicker(matchId: string) {
	const pitchRef = useRef<HTMLDivElement | null>(null);
	const benchRef = useRef<HTMLDivElement | null>(null);

	const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
	const [isOverPitch, setIsOverPitch] = useState(false);
	const [isOverBench, setIsOverBench] = useState(false);
	const [hoveredFormationIndex, setHoveredFormationIndex] = useState<
		number | null
	>(null);
	const [openMenu, setOpenMenu] = useState<OpenPlayerMenu | null>(null);

	const players = usePlayerStore((state) => state.players);

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
	const selectedFormation = currentMatch.selectedFormation;
	const isLineupLocked = currentMatch.isLineupLocked;

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

	function isPointInsideRect(point: { x: number; y: number }, rect: DOMRect) {
		return (
			point.x >= rect.left &&
			point.x <= rect.right &&
			point.y >= rect.top &&
			point.y <= rect.bottom
		);
	}

	function getDraggedCentre(event: DragEndEvent | DragMoveEvent) {
		const activeRect = event.active.rect.current.initial;

		if (!activeRect) {
			return null;
		}

		return {
			x: activeRect.left + event.delta.x + activeRect.width / 2,
			y: activeRect.top + event.delta.y + activeRect.height / 2,
		};
	}

	function getPitchPosition(point: { x: number; y: number }) {
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

	function getClosestFormationIndex(
		pitchPosition: { x: number; y: number },
		playerId: string
	) {
		const formation = formations[selectedFormation];

		const occupiedIndexes = new Set<number>();

		pitchPlayers.forEach((pitchPlayer) => {
			if (pitchPlayer.playerId === playerId) {
				return;
			}

			if (pitchPlayer.positionIndex !== undefined) {
				occupiedIndexes.add(pitchPlayer.positionIndex);
				return;
			}

			const occupiedIndex = formation.findIndex((position) => {
				const distanceX = position.x - pitchPlayer.x;
				const distanceY = position.y - pitchPlayer.y;
				const distance = Math.sqrt(
					distanceX * distanceX + distanceY * distanceY
				);

				return distance <= 4;
			});

			if (occupiedIndex >= 0) {
				occupiedIndexes.add(occupiedIndex);
			}
		});

		let closestIndex: number | null = null;
		let closestDistance = Number.POSITIVE_INFINITY;

		formation.forEach((position, index) => {
			if (occupiedIndexes.has(index)) {
				return;
			}

			const distanceX = position.x - pitchPosition.x;
			const distanceY = position.y - pitchPosition.y;
			const distance = distanceX * distanceX + distanceY * distanceY;

			if (distance < closestDistance) {
				closestDistance = distance;
				closestIndex = index;
			}
		});

		return closestIndex;
	}

	function getSnappedPitchPosition(
		pitchPosition: { x: number; y: number },
		playerId: string
	) {
		const closestFormationIndex = getClosestFormationIndex(
			pitchPosition,
			playerId
		);

		if (closestFormationIndex === null) {
			return {
				...pitchPosition,
				positionIndex: undefined,
			};
		}

		const formationPosition =
			formations[selectedFormation][closestFormationIndex];

		return {
			x: formationPosition.x,
			y: formationPosition.y,
			positionIndex: closestFormationIndex,
		};
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

	function assignPlayerToPosition(playerId: string, positionIndex: number) {
		if (isLineupLocked) {
			return;
		}

		const position = formations[selectedFormation][positionIndex];

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
			x: position.x,
			y: position.y,
			area: "pitch",
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
			x: 0,
			y: 0,
			area: "bench",
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

		const formation = formations[formationName];

		const pitchSelectedPlayers = currentMatch.selectedPlayers.filter(
			(selectedPlayer) => selectedPlayer.area === "pitch"
		);

		const updatedSelectedPlayers = currentMatch.selectedPlayers.map(
			(selectedPlayer) => {
				if (selectedPlayer.area !== "pitch") {
					return {
						...selectedPlayer,
						positionIndex: undefined,
					};
				}

				const pitchPlayerIndex = pitchSelectedPlayers.findIndex(
					(pitchPlayer) => pitchPlayer.playerId === selectedPlayer.playerId
				);

				const formationPosition = formation[pitchPlayerIndex];

				if (!formationPosition) {
					return {
						...selectedPlayer,
						positionIndex: undefined,
					};
				}

				return {
					...selectedPlayer,
					x: formationPosition.x,
					y: formationPosition.y,
					positionIndex: pitchPlayerIndex,
				};
			}
		);

		setSelectedPlayers(matchId, updatedSelectedPlayers);
		setOpenMenu(null);
	}

	function openPlayerMenu(
		playerId: string,
		event: MouseEvent<HTMLButtonElement>
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

		setOpenMenu(null);
		setActiveDragData(dragData);
	}

	function handleDragMove(event: DragMoveEvent) {
		if (isLineupLocked) {
			return;
		}

		const dragData = event.active.data.current as DragData | undefined;
		const point = getDraggedCentre(event);

		if (!point || !dragData) {
			return;
		}

		const pitchRect = pitchRef.current?.getBoundingClientRect();
		const benchRect = benchRef.current?.getBoundingClientRect();

		const overPitch = pitchRect ? isPointInsideRect(point, pitchRect) : false;
		const overBench = benchRect ? isPointInsideRect(point, benchRect) : false;

		setIsOverPitch(overPitch);
		setIsOverBench(overBench);

		if (!overPitch) {
			setHoveredFormationIndex(null);
			return;
		}

		const pitchPosition = getPitchPosition(point);

		if (!pitchPosition) {
			setHoveredFormationIndex(null);
			return;
		}

		const closestIndex = getClosestFormationIndex(
			pitchPosition,
			dragData.playerId
		);

		setHoveredFormationIndex(closestIndex);
	}

	function resetDragState() {
		setActiveDragData(null);
		setIsOverPitch(false);
		setIsOverBench(false);
		setHoveredFormationIndex(null);
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
		const point = getDraggedCentre(event);

		resetDragState();

		if (!dragData || !point) {
			return;
		}

		const playerId = dragData.playerId;

		const pitchRect = pitchRef.current?.getBoundingClientRect();
		const benchRect = benchRef.current?.getBoundingClientRect();

		const droppedOnBench = benchRect
			? isPointInsideRect(point, benchRect)
			: false;

		const droppedOnPitch = pitchRect
			? isPointInsideRect(point, pitchRect)
			: false;

		if (droppedOnBench) {
			assignPlayerToBench(playerId);
			return;
		}

		if (droppedOnPitch) {
			const pitchPosition = getPitchPosition(point);

			if (!pitchPosition) {
				return;
			}

			const snappedPosition = getSnappedPitchPosition(pitchPosition, playerId);

			replaceOrAddSelectedPlayer({
				playerId,
				x: snappedPosition.x,
				y: snappedPosition.y,
				area: "pitch",
				positionIndex: snappedPosition.positionIndex,
			});
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
		openMenu,
		selectedFormation,
		isLineupLocked,
		availablePlayers,
		pitchPlayers,
		benchPlayers,
		openMenuPlayerIsSelected,
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