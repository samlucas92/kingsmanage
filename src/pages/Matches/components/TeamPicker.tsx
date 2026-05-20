import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useRef, useState } from "react";
import { usePlayerStore } from "../../../stores/players";
import { useMatchStore } from "../../../stores/match";

interface TeamPickerProps {
  matchId: string;
}

type DragType = "available" | "selected";

type DragData = {
  type: DragType;
  playerId: string;
};

export default function TeamPicker({ matchId }: TeamPickerProps) {
  const pitchRef = useRef<HTMLDivElement | null>(null);
  const benchRef = useRef<HTMLDivElement | null>(null);

  const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
  const [isOverPitch, setIsOverPitch] = useState(false);
  const [isOverBench, setIsOverBench] = useState(false);

  const players = usePlayerStore((state) => state.players);

  const match = useMatchStore((state) =>
    state.matches.find((match) => match.id === matchId)
  );

  const upsertSelectedPlayer = useMatchStore(
    (state) => state.upsertSelectedPlayer
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

  function isPointInsideRect(
    point: { x: number; y: number },
    rect: DOMRect
  ) {
    return (
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom
    );
  }

  function getDraggedCentre(event: DragEndEvent) {
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

  function handleDragStart(event: DragStartEvent) {
    const dragData = event.active.data.current as DragData | undefined;

    if (!dragData) {
      return;
    }

    setActiveDragData(dragData);
  }

  function handleDragMove(event: DragEndEvent) {
    const point = getDraggedCentre(event);

    if (!point) {
      return;
    }

    const pitchRect = pitchRef.current?.getBoundingClientRect();
    const benchRect = benchRef.current?.getBoundingClientRect();

    setIsOverPitch(pitchRect ? isPointInsideRect(point, pitchRect) : false);
    setIsOverBench(benchRect ? isPointInsideRect(point, benchRect) : false);
  }

  function handleDragCancel() {
    setActiveDragData(null);
    setIsOverPitch(false);
    setIsOverBench(false);
  }

  function handleDragEnd(event: DragEndEvent) {
    const dragData = event.active.data.current as DragData | undefined;
    const point = getDraggedCentre(event);

    setActiveDragData(null);
    setIsOverPitch(false);
    setIsOverBench(false);

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
      upsertSelectedPlayer(matchId, {
        playerId,
        x: 0,
        y: 0,
        area: "bench",
      });

      return;
    }

    if (droppedOnPitch) {
      const pitchPosition = getPitchPosition(point);

      if (!pitchPosition) {
        return;
      }

      upsertSelectedPlayer(matchId, {
        playerId,
        x: pitchPosition.x,
        y: pitchPosition.y,
        area: "pitch",
      });
    }
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Available players
          </h3>

          <div className="space-y-2">
            {availablePlayers.map((player) => (
              <AvailablePlayer
                key={player.id}
                id={player.id}
                name={player.name}
              />
            ))}

            {availablePlayers.length === 0 && (
              <p className="text-sm text-slate-500">
                All active players are already selected.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div
            ref={pitchRef}
            className={`relative mx-auto h-[640px] w-full max-w-[460px] overflow-hidden rounded-xl border-4 bg-green-700 ${
              isOverPitch ? "border-yellow-300" : "border-white"
            }`}
          >
            <div className="absolute inset-4 rounded-lg border-2 border-white/80" />

            <div className="absolute left-4 top-1/2 h-0.5 w-[calc(100%-2rem)] -translate-y-1/2 bg-white/70" />

            <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80" />

            <div className="absolute left-1/2 top-4 h-24 w-44 -translate-x-1/2 border-2 border-t-0 border-white/80" />

            <div className="absolute bottom-4 left-1/2 h-24 w-44 -translate-x-1/2 border-2 border-b-0 border-white/80" />

            <div className="absolute left-1/2 top-4 h-10 w-20 -translate-x-1/2 border-2 border-t-0 border-white/80" />

            <div className="absolute bottom-4 left-1/2 h-10 w-20 -translate-x-1/2 border-2 border-b-0 border-white/80" />

            {pitchPlayers.map((selectedPlayer) => (
              <SelectedPitchPlayer
                key={selectedPlayer.playerId}
                playerId={selectedPlayer.playerId}
                name={getPlayerName(selectedPlayer.playerId)}
                x={selectedPlayer.x}
                y={selectedPlayer.y}
                onRemove={() =>
                  removeSelectedPlayer(matchId, selectedPlayer.playerId)
                }
              />
            ))}
          </div>

          <div
            ref={benchRef}
            className={`rounded-xl border-2 bg-white p-4 ${
              isOverBench ? "border-yellow-400" : "border-slate-200"
            }`}
          >
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Bench
            </h3>

            <div className="flex min-h-20 flex-wrap gap-2">
              {benchPlayers.map((selectedPlayer) => (
                <BenchPlayer
                  key={selectedPlayer.playerId}
                  playerId={selectedPlayer.playerId}
                  name={getPlayerName(selectedPlayer.playerId)}
                  onRemove={() =>
                    removeSelectedPlayer(matchId, selectedPlayer.playerId)
                  }
                />
              ))}

              {benchPlayers.length === 0 && (
                <p className="text-sm text-slate-500">
                  Drag players here to put them on the bench.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

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
}

function AvailablePlayer({ id, name }: AvailablePlayerProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `available-${id}`,
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
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm ${
        isDragging ? "opacity-20" : ""
      }`}
    >
      {name}
    </div>
  );
}

interface SelectedPitchPlayerProps {
  playerId: string;
  name: string;
  x: number;
  y: number;
  onRemove: () => void;
}

function SelectedPitchPlayer({
  playerId,
  name,
  x,
  y,
  onRemove,
}: SelectedPitchPlayerProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `selected-${playerId}`,
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
      className={`absolute z-20 flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900 shadow ${
        isDragging ? "opacity-20" : ""
      }`}
    >
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="cursor-grab"
      >
        {name}
      </button>

      <button
        type="button"
        onClick={onRemove}
        className="rounded-full px-1 text-slate-500 hover:bg-slate-100 hover:text-red-600"
      >
        ×
      </button>
    </div>
  );
}

interface BenchPlayerProps {
  playerId: string;
  name: string;
  onRemove: () => void;
}

function BenchPlayer({ playerId, name, onRemove }: BenchPlayerProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `bench-${playerId}`,
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
      className={`flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm ${
        isDragging ? "opacity-20" : ""
      }`}
    >
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="cursor-grab"
      >
        {name}
      </button>

      <button
        type="button"
        onClick={onRemove}
        className="rounded-full px-1 text-slate-500 hover:bg-slate-100 hover:text-red-600"
      >
        ×
      </button>
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