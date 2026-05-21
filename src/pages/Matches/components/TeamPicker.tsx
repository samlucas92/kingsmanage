import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Fragment, useRef, useState, type MouseEvent } from "react";
import { usePlayerStore } from "../../../stores/players";
import { useMatchStore } from "../../../stores/match";
import type { LineupFormation, SelectedPlayer } from "../../../stores/match";

interface TeamPickerProps {
  matchId: string;
}

type DragType = "available" | "selected";

type DragData = {
  type: DragType;
  playerId: string;
};

type FormationPosition = {
  x: number;
  y: number;
  label: string;
};

type OpenPlayerMenu = {
  playerId: string;
  left: number;
  top: number;
};

const MENU_WIDTH = 288;
const MENU_MAX_HEIGHT = 280;

const formations: Record<LineupFormation, FormationPosition[]> = {
  "4-4-2": [
    { x: 50, y: 88, label: "GK" },
    { x: 20, y: 68, label: "LB" },
    { x: 40, y: 70, label: "CB" },
    { x: 60, y: 70, label: "CB" },
    { x: 80, y: 68, label: "RB" },
    { x: 20, y: 46, label: "LM" },
    { x: 40, y: 50, label: "CM" },
    { x: 60, y: 50, label: "CM" },
    { x: 80, y: 46, label: "RM" },
    { x: 40, y: 24, label: "ST" },
    { x: 60, y: 24, label: "ST" },
  ],

  "4-3-3": [
    { x: 50, y: 88, label: "GK" },
    { x: 20, y: 68, label: "LB" },
    { x: 40, y: 70, label: "CB" },
    { x: 60, y: 70, label: "CB" },
    { x: 80, y: 68, label: "RB" },
    { x: 30, y: 48, label: "CM" },
    { x: 50, y: 52, label: "CM" },
    { x: 70, y: 48, label: "CM" },
    { x: 25, y: 24, label: "LW" },
    { x: 50, y: 20, label: "ST" },
    { x: 75, y: 24, label: "RW" },
  ],

  "3-5-2": [
    { x: 50, y: 88, label: "GK" },
    { x: 30, y: 70, label: "CB" },
    { x: 50, y: 72, label: "CB" },
    { x: 70, y: 70, label: "CB" },
    { x: 15, y: 48, label: "LWB" },
    { x: 35, y: 52, label: "CM" },
    { x: 50, y: 54, label: "CM" },
    { x: 65, y: 52, label: "CM" },
    { x: 85, y: 48, label: "RWB" },
    { x: 40, y: 24, label: "ST" },
    { x: 60, y: 24, label: "ST" },
  ],

  "4-2-3-1": [
    { x: 50, y: 88, label: "GK" },
    { x: 20, y: 68, label: "LB" },
    { x: 40, y: 70, label: "CB" },
    { x: 60, y: 70, label: "CB" },
    { x: 80, y: 68, label: "RB" },
    { x: 40, y: 53, label: "CDM" },
    { x: 60, y: 53, label: "CDM" },
    { x: 25, y: 35, label: "LAM" },
    { x: 50, y: 32, label: "CAM" },
    { x: 75, y: 35, label: "RAM" },
    { x: 50, y: 18, label: "ST" },
  ],
};

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

    const left = Math.min(
      rect.left,
      window.innerWidth - MENU_WIDTH - 16
    );

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

interface AvailablePlayerProps {
  id: string;
  name: string;
  disabled: boolean;
  isMenuOpen: boolean;
  onOpenMenu: (event: MouseEvent<HTMLButtonElement>) => void;
}

function AvailablePlayer({
  id,
  name,
  disabled,
  isMenuOpen,
  onOpenMenu,
}: AvailablePlayerProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `available-${id}`,
      disabled,
      data: {
        type: "available",
        playerId: id,
      } satisfies DragData,
    });

  const style = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition ${
        disabled ? "cursor-not-allowed opacity-60" : "hover:bg-slate-100"
      } ${isDragging ? "opacity-20" : ""}`}
    >
      <button
        type="button"
        {...(!disabled ? listeners : {})}
        {...(!disabled ? attributes : {})}
        className={disabled ? "cursor-not-allowed" : "cursor-grab"}
      >
        ☰
      </button>

      <button
        type="button"
        onClick={onOpenMenu}
        disabled={disabled}
        className="flex-1 text-left disabled:cursor-not-allowed"
      >
        {name}
      </button>

      <button
        type="button"
        onClick={onOpenMenu}
        disabled={disabled}
        className={`rounded px-2 text-slate-500 hover:bg-slate-200 disabled:cursor-not-allowed ${
          isMenuOpen ? "bg-slate-200" : ""
        }`}
      >
        ⋯
      </button>
    </div>
  );
}

interface SelectedPitchPlayerProps {
  playerId: string;
  name: string;
  initials: string;
  x: number;
  y: number;
  disabled: boolean;
  isMenuOpen: boolean;
  onOpenMenu: (event: MouseEvent<HTMLButtonElement>) => void;
}

function SelectedPitchPlayer({
  playerId,
  name,
  initials,
  x,
  y,
  disabled,
  isMenuOpen,
  onOpenMenu,
}: SelectedPitchPlayerProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `selected-${playerId}`,
      disabled,
      data: {
        type: "selected",
        playerId,
      } satisfies DragData,
    });

  const dragTransform = CSS.Translate.toString(transform);

  const style = {
    left: `${x}%`,
    top: `${y}%`,
    transform:
      !isDragging && dragTransform
        ? `${dragTransform} translate(-50%, -50%)`
        : "translate(-50%, -50%)",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      title={name}
      className={`absolute z-20 flex h-12 w-12 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg ${
        isMenuOpen
          ? "border-yellow-300 bg-yellow-300 text-slate-900"
          : "border-white bg-blue-700 text-white"
      } ${disabled ? "opacity-90" : ""} ${isDragging ? "opacity-20" : ""}`}
    >
      <button
        type="button"
        {...(!disabled ? listeners : {})}
        {...(!disabled ? attributes : {})}
        className={`flex h-full w-full items-center justify-center rounded-full ${
          disabled ? "cursor-default" : "cursor-grab"
        }`}
        aria-label={`Move ${name}`}
      >
        {initials}
      </button>

      {!disabled && (
        <button
          type="button"
          onClick={onOpenMenu}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-white text-xs font-bold text-slate-600 shadow hover:text-blue-700"
          aria-label={`Open menu for ${name}`}
        >
          ⋯
        </button>
      )}
    </div>
  );
}

interface BenchPlayerProps {
  playerId: string;
  name: string;
  disabled: boolean;
  isMenuOpen: boolean;
  onOpenMenu: (event: MouseEvent<HTMLButtonElement>) => void;
}

function BenchPlayer({
  playerId,
  name,
  disabled,
  isMenuOpen,
  onOpenMenu,
}: BenchPlayerProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `bench-${playerId}`,
      disabled,
      data: {
        type: "selected",
        playerId,
      } satisfies DragData,
    });

  const style = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition ${
        disabled ? "opacity-70" : "hover:bg-slate-100"
      } ${isDragging ? "opacity-20" : ""}`}
    >
      <button
        type="button"
        {...(!disabled ? listeners : {})}
        {...(!disabled ? attributes : {})}
        className={disabled ? "cursor-default" : "cursor-grab"}
      >
        ☰
      </button>

      <button
        type="button"
        onClick={onOpenMenu}
        disabled={disabled}
        className="flex-1 text-left disabled:cursor-default"
      >
        {name}
      </button>

      {!disabled && (
        <button
          type="button"
          onClick={onOpenMenu}
          className={`rounded px-2 text-slate-500 hover:bg-slate-200 ${
            isMenuOpen ? "bg-slate-200" : ""
          }`}
        >
          ⋯
        </button>
      )}
    </div>
  );
}

interface FloatingPlayerAssignMenuProps {
  playerId: string;
  left: number;
  top: number;
  formation: FormationPosition[];
  pitchPlayers: SelectedPlayer[];
  getPlayerName: (playerId: string) => string;
  onAssignPosition: (playerId: string, positionIndex: number) => void;
  onAssignBench: (playerId: string) => void;
  onRemove: (playerId: string) => void;
  showRemove: boolean;
}

interface FloatingPlayerAssignMenuProps {
  playerId: string;
  left: number;
  top: number;
  formation: FormationPosition[];
  pitchPlayers: SelectedPlayer[];
  getPlayerName: (playerId: string) => string;
  onAssignPosition: (playerId: string, positionIndex: number) => void;
  onAssignBench: (playerId: string) => void;
  onRemove: (playerId: string) => void;
  showRemove: boolean;
}

function FloatingPlayerAssignMenu({
  playerId,
  left,
  top,
  formation,
  pitchPlayers,
  getPlayerName,
  onAssignPosition,
  onAssignBench,
  onRemove,
  showRemove,
}: FloatingPlayerAssignMenuProps) {
  return (
    <div
      className="fixed z-50 w-60 rounded-lg border border-slate-200 bg-white p-2 shadow-xl"
      style={{
        left,
        top,
      }}
    >
      <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Assign position
      </p>

      <div className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
        {formation.map((position, index) => {
          const occupant = pitchPlayers.find(
            (pitchPlayer) => pitchPlayer.positionIndex === index
          );

          const occupiedByOtherPlayer =
            occupant && occupant.playerId !== playerId;

          return (
            <button
              key={`${position.label}-${index}`}
              type="button"
              disabled={occupiedByOtherPlayer}
              onClick={() => onAssignPosition(playerId, index)}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="font-semibold text-slate-800">
                {position.label}
              </span>

              <span className="truncate text-[11px] text-slate-500">
                {occupant ? getPlayerName(occupant.playerId) : "Empty"}
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

interface DragOverlayPlayerProps {
  name: string;
}

function DragOverlayPlayer({ name }: DragOverlayPlayerProps) {
  return (
    <div className="cursor-grabbing rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-xl">
      {name}
    </div>
  );
}