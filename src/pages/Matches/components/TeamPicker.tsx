import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Fragment, useRef, useState, type MouseEvent } from "react";
import { usePlayerStore } from "../../../stores/players";
import { useMatchStore } from "../../../stores/match";
import type { LineupFormation, SelectedPlayer } from "../../../stores/match";
import { formations } from "./team-picker/formations";
import {
  AvailablePlayer,
  BenchPlayer,
  DragOverlayPlayer,
  SelectedPitchPlayer,
} from "./team-picker/PlayerCards";
import { FloatingPlayerAssignMenu } from "./team-picker/FloatingPlayerAssignMenu";
import type { DragData, OpenPlayerMenu } from "./team-picker/Types";

interface TeamPickerProps {
  matchId: string;
}

const MENU_WIDTH = 240;
const MENU_MAX_HEIGHT = 300;

export default function TeamPicker({ matchId }: TeamPickerProps) {
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

  if (!match) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        Match not found.
      </div>
    );
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

  function getPlayerName(playerId: string) {
    const player = players.find((player) => player.id === playerId);
    return player?.name ?? "Unknown player";
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

  const openMenuPlayerIsSelected = openMenu
    ? selectedPlayerIds.includes(openMenu.playerId)
    : false;

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid items-start gap-4 lg:grid-cols-[260px_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Available players
            </h3>

            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
              {availablePlayers.length}
            </span>
          </div>

          {isLineupLocked && (
            <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
              Team saved. Click Edit Team to make changes.
            </p>
          )}

          <div className="relative space-y-2 overflow-visible pr-1">
            {availablePlayers.map((player) => (
              <AvailablePlayer
                key={player.id}
                id={player.id}
                name={player.name}
                disabled={isLineupLocked}
                isMenuOpen={openMenu?.playerId === player.id}
                onOpenMenu={(event) => openPlayerMenu(player.id, event)}
              />
            ))}

            {availablePlayers.length === 0 && (
              <p className="text-sm text-slate-500">
                All active players are already selected.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Starting XI
              </h3>
              <p className="text-xs text-slate-500">
                {isLineupLocked
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
                  onClick={() => applyFormation(formationName)}
                  disabled={isLineupLocked}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                    selectedFormation === formationName
                      ? "border-blue-700 bg-blue-700 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {formationName}
                </button>
              ))}

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {pitchPlayers.length}/11
              </span>
            </div>
          </div>

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

            {formations[selectedFormation].map((position, index) => {
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

              return (
                <Fragment key={selectedPlayer.playerId}>
                  <SelectedPitchPlayer
                    playerId={selectedPlayer.playerId}
                    name={playerName}
                    initials={getPlayerInitials(playerName)}
                    x={selectedPlayer.x}
                    y={selectedPlayer.y}
                    disabled={isLineupLocked}
                    isMenuOpen={openMenu?.playerId === selectedPlayer.playerId}
                    onOpenMenu={(event) =>
                      openPlayerMenu(selectedPlayer.playerId, event)
                    }
                  />
                </Fragment>
              );
            })}
          </div>

          <div
            ref={benchRef}
            className={`rounded-xl border-2 bg-white p-3 shadow-sm ${
              isOverBench ? "border-yellow-400" : "border-slate-200"
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Bench
                </h3>
                <p className="text-xs text-slate-500">
                  {isLineupLocked ? "Bench is locked." : "Drop subs here."}
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {benchPlayers.length}
              </span>
            </div>

            <div className="grid min-h-16 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {benchPlayers.map((selectedPlayer) => (
                <BenchPlayer
                  key={selectedPlayer.playerId}
                  playerId={selectedPlayer.playerId}
                  name={getPlayerName(selectedPlayer.playerId)}
                  disabled={isLineupLocked}
                  isMenuOpen={openMenu?.playerId === selectedPlayer.playerId}
                  onOpenMenu={(event) =>
                    openPlayerMenu(selectedPlayer.playerId, event)
                  }
                />
              ))}

              {benchPlayers.length === 0 && (
                <p className="text-sm text-slate-500 sm:col-span-2 xl:col-span-3">
                  {isLineupLocked
                    ? "No substitutes selected."
                    : "Drag players here to put them on the bench."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {openMenu && (
        <>
          <button
            type="button"
            aria-label="Close player menu"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={() => setOpenMenu(null)}
          />

          <FloatingPlayerAssignMenu
            playerId={openMenu.playerId}
            left={openMenu.left}
            top={openMenu.top}
            formation={formations[selectedFormation]}
            pitchPlayers={pitchPlayers}
            getPlayerName={getPlayerName}
            onAssignPosition={assignPlayerToPosition}
            onAssignBench={assignPlayerToBench}
            onRemove={removePlayerFromSelection}
            showRemove={openMenuPlayerIsSelected}
          />
        </>
      )}

      <DragOverlay>
        {activeDragData ? (
          <DragOverlayPlayer name={getPlayerName(activeDragData.playerId)} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}