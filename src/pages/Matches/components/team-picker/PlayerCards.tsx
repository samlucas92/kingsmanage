import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { MouseEvent } from "react";
import type { ClubEventAvailabilityStatus } from "../../../../types/events";
import type { TrainingAvailabilitySummary } from "../../../../utils/trainingAvailability";
import type { DragData, DropData } from "./Types";

interface AvailablePlayerProps {
	id: string;
	name: string;
	disabled: boolean;
	isMenuOpen: boolean;
	isSwapTarget?: boolean;
	availabilityStatus?: ClubEventAvailabilityStatus;
	trainingAvailability?: TrainingAvailabilitySummary;
	onOpenMenu: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function AvailablePlayer({
	id,
	name,
	disabled,
	isMenuOpen,
	isSwapTarget = false,
	availabilityStatus,
	trainingAvailability,
	onOpenMenu,
}: AvailablePlayerProps) {
	const {
		attributes,
		listeners,
		setNodeRef: setDraggableNodeRef,
		transform,
		isDragging,
	} = useDraggable({
		id: `available-${id}`,
		disabled,
		data: {
			type: "available",
			playerId: id,
		} satisfies DragData,
	});

	const { setNodeRef: setDroppableNodeRef } = useDroppable({
		id: `drop-available-${id}`,
		disabled,
		data: {
			type: "player",
			playerId: id,
			area: "available",
		} satisfies DropData,
	});

	function setNodeRef(node: HTMLDivElement | null) {
		setDraggableNodeRef(node);
		setDroppableNodeRef(node);
	}

	const style = {
		transform: isDragging ? undefined : CSS.Translate.toString(transform),
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition ${
				isSwapTarget
					? "scale-[1.02] border-yellow-400 bg-yellow-100 text-slate-950 ring-2 ring-yellow-300"
					: disabled
						? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500 opacity-60"
						: "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
			} ${isDragging ? "opacity-20" : ""}`}
		>
			<button
				type="button"
				{...(!disabled ? listeners : {})}
				{...(!disabled ? attributes : {})}
				className={disabled ? "cursor-not-allowed" : "cursor-grab"}
				aria-label={`Drag ${name}`}
			>
				☰
			</button>

			<button
				type="button"
				onClick={onOpenMenu}
				disabled={disabled}
				className="flex-1 truncate text-left disabled:cursor-not-allowed"
				title={name}
			>
				{isSwapTarget ? `↔ ${name}` : name}
			</button>

			<div className="flex shrink-0 flex-col items-end gap-1">
				{availabilityStatus && (
					<span
						className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getAvailabilityStatusClass(
							availabilityStatus
						)}`}
					>
						{getAvailabilityStatusLabel(availabilityStatus)}
					</span>
				)}

				<TrainingAvailabilityBadge summary={trainingAvailability} />
			</div>

			<button
				type="button"
				onClick={onOpenMenu}
				disabled={disabled}
				className={`rounded px-2 text-slate-500 hover:bg-slate-200 disabled:cursor-not-allowed ${
					isMenuOpen ? "bg-slate-200" : ""
				}`}
				aria-label={`Open menu for ${name}`}
			>
				⋯
			</button>
		</div>
	);
}

function TrainingAvailabilityBadge({
	summary,
}: {
	summary?: TrainingAvailabilitySummary;
}) {
	if (!summary || summary.total === 0) {
		return null;
	}

	return (
		<span
			className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getTrainingAvailabilityClass(
				summary.percentage
			)}`}
			title={`${summary.available}/${summary.total} training available · ${summary.declined} declined · ${summary.unanswered} no response`}
		>
			Training {summary.percentage}%
		</span>
	);
}

function getAvailabilityStatusLabel(status: ClubEventAvailabilityStatus) {
	if (status === "Available") {
		return "Available";
	}

	if (status === "Declined") {
		return "Declined";
	}

	return "No reply";
}

function getAvailabilityStatusClass(status: ClubEventAvailabilityStatus) {
	if (status === "Available") {
		return "bg-green-100 text-green-800";
	}

	if (status === "Declined") {
		return "bg-red-100 text-red-800";
	}

	return "bg-slate-100 text-slate-600";
}

function getTrainingAvailabilityClass(percentage: number) {
	if (percentage >= 75) {
		return "bg-green-100 text-green-800";
	}

	if (percentage >= 50) {
		return "bg-amber-100 text-amber-800";
	}

	return "bg-red-100 text-red-800";
}

interface SelectedPitchPlayerProps {
	playerId: string;
	name: string;
	initials: string;
	number?: number;
	x: number;
	y: number;
	disabled: boolean;
	isMenuOpen: boolean;
	isSwapTarget: boolean;
	isOutOfPosition: boolean;
	preferredPositions: string[];
	enableDrag?: boolean;
	onOpenMenu: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function SelectedPitchPlayer({
	playerId,
	name,
	initials,
	number,
	x,
	y,
	disabled,
	isMenuOpen,
	isSwapTarget,
	isOutOfPosition,
	preferredPositions,
	enableDrag = true,
	onOpenMenu,
}: SelectedPitchPlayerProps) {
	const canDrag = enableDrag && !disabled;
	const {
		attributes,
		listeners,
		setNodeRef: setDraggableNodeRef,
		transform,
		isDragging,
	} = useDraggable({
		id: `selected-${playerId}`,
		disabled: !canDrag,
		data: {
			type: "selected",
			playerId,
		} satisfies DragData,
	});

	const { setNodeRef: setDroppableNodeRef } = useDroppable({
		id: `drop-pitch-${playerId}`,
		disabled,
		data: {
			type: "player",
			playerId,
			area: "pitch",
		} satisfies DropData,
	});

	function setNodeRef(node: HTMLDivElement | null) {
		setDraggableNodeRef(node);
		setDroppableNodeRef(node);
	}

	const dragTransform = CSS.Translate.toString(transform);

	const style = {
		left: `${x}%`,
		top: `${y}%`,
		transform:
			!isDragging && dragTransform
				? `${dragTransform} translate(-50%, -50%)`
				: "translate(-50%, -50%)",
	};

	const title = isSwapTarget
		? `Drop to replace or swap with ${name}`
		: isOutOfPosition
			? `${name} - out of position. Prefers: ${preferredPositions.join(", ")}`
			: `${name}${
					preferredPositions.length > 0
						? ` - prefers: ${preferredPositions.join(", ")}`
						: ""
				}`;

	return (
		<div
			ref={setNodeRef}
			style={style}
			title={title}
			className={`absolute z-20 flex h-[4.25rem] w-16 items-start justify-center text-xs font-bold transition sm:h-[4.5rem] sm:w-[4.5rem] ${
				isSwapTarget
					? "scale-110 text-yellow-300"
					: isMenuOpen
						? "text-yellow-300"
						: isOutOfPosition
							? "text-amber-400"
							: "text-blue-700"
			} ${disabled ? "opacity-90" : ""} ${isDragging ? "opacity-20" : ""}`}
			data-testid="pitch-player-shirt"
		>
			<button
				type="button"
				{...(canDrag ? listeners : {})}
				{...(canDrag ? attributes : {})}
				onClick={disabled ? undefined : onOpenMenu}
				className={`relative flex h-[3.25rem] w-[3.25rem] items-center justify-center drop-shadow-lg ${
					disabled ? "cursor-default" : canDrag ? "cursor-grab" : "cursor-pointer"
				}`}
				aria-label={`Open actions for ${name}`}
			>
				<svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full" aria-hidden="true">
					<path
						d="M20 6 27 2h10l7 4 15 8-8 15-7-4v35H20V25l-7 4-8-15Z"
						fill="currentColor"
						stroke="white"
						strokeWidth="2.5"
						strokeLinejoin="round"
					/>
				</svg>
				<span className={`relative z-10 font-black ${isMenuOpen || isSwapTarget ? "text-slate-950" : "text-white"}`}>
					{isSwapTarget ? "↔" : number || initials}
				</span>
			</button>

			<span className="pointer-events-none absolute inset-x-0 top-[3rem] truncate rounded-md bg-slate-950/80 px-1.5 py-0.5 text-center text-[9px] font-bold leading-4 text-white shadow">
				{name}
			</span>

			{isOutOfPosition && !isSwapTarget && (
				<span className="pointer-events-none absolute left-0 top-0 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-amber-100 text-[10px] font-bold text-amber-800 shadow">
					!
				</span>
			)}

			{!disabled && (
				<button
					type="button"
					onClick={onOpenMenu}
					className="absolute right-0 top-0 hidden h-5 w-5 items-center justify-center rounded-full border border-white bg-white text-xs font-bold text-slate-600 shadow hover:text-blue-700 xl:flex"
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
	number?: number;
	disabled: boolean;
	isMenuOpen: boolean;
	isSwapTarget?: boolean;
	onOpenMenu: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function BenchPlayer({
	playerId,
	name,
	number,
	disabled,
	isMenuOpen,
	isSwapTarget = false,
	onOpenMenu,
}: BenchPlayerProps) {
	const {
		attributes,
		listeners,
		setNodeRef: setDraggableNodeRef,
		transform,
		isDragging,
	} = useDraggable({
		id: `bench-${playerId}`,
		disabled,
		data: {
			type: "selected",
			playerId,
		} satisfies DragData,
	});

	const { setNodeRef: setDroppableNodeRef } = useDroppable({
		id: `drop-bench-${playerId}`,
		disabled,
		data: {
			type: "player",
			playerId,
			area: "bench",
		} satisfies DropData,
	});

	function setNodeRef(node: HTMLDivElement | null) {
		setDraggableNodeRef(node);
		setDroppableNodeRef(node);
	}

	const style = {
		transform: isDragging ? undefined : CSS.Translate.toString(transform),
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`group flex min-w-[170px] max-w-full items-center gap-2 rounded-full border px-2 py-1.5 text-sm font-semibold shadow-sm transition ${
				isSwapTarget
					? "scale-[1.03] border-yellow-400 bg-yellow-200 text-slate-950 ring-2 ring-yellow-300"
					: disabled
						? "border-slate-200 bg-slate-100 text-slate-500"
						: "border-yellow-200 bg-yellow-50 text-slate-900 hover:border-yellow-300 hover:bg-yellow-100"
			} ${isDragging ? "opacity-20" : ""}`}
		>
			<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-900 text-xs font-black text-white">
				{isSwapTarget ? "↔" : number ?? "B"}
			</span>

			<button
				type="button"
				{...(!disabled ? listeners : {})}
				{...(!disabled ? attributes : {})}
				className={`hidden shrink-0 text-slate-500 xl:inline-flex ${
					disabled ? "cursor-default" : "cursor-grab"
				}`}
				aria-label={`Drag ${name}`}
			>
				☰
			</button>

			<button
				type="button"
				onClick={onOpenMenu}
				disabled={disabled}
				className="min-w-0 flex-1 truncate text-left disabled:cursor-default"
				title={name}
			>
				{name}
			</button>

			{!disabled && (
				<button
					type="button"
					onClick={onOpenMenu}
					className={`hidden h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-blue-800 xl:flex ${
						isMenuOpen ? "bg-white text-blue-800" : ""
					}`}
					aria-label={`Open menu for ${name}`}
				>
					⋯
				</button>
			)}
		</div>
	);
}

interface DragOverlayPlayerProps {
	name: string;
	initials: string;
	number?: number;
	variant: "available" | "pitch" | "bench";
}

export function DragOverlayPlayer({
	name,
	initials,
	number,
	variant,
}: DragOverlayPlayerProps) {
	const label =
		variant === "pitch"
			? "Pitch player"
			: variant === "bench"
				? "Bench player"
				: "Available player";

	if (variant === "pitch") {
		return (
			<div
				className="pointer-events-none relative flex h-[4.5rem] w-[4.5rem] items-start justify-center text-blue-700 drop-shadow-2xl"
				data-testid="drag-overlay-shirt"
			>
				<div className="relative h-[3.4rem] w-[3.4rem]">
					<svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full" aria-hidden="true">
						<path
							d="M20 6 27 2h10l7 4 15 8-8 15-7-4v35H20V25l-7 4-8-15Z"
							fill="currentColor"
							stroke="white"
							strokeWidth="2.5"
							strokeLinejoin="round"
						/>
					</svg>
					<span className="absolute inset-x-0 top-[30%] text-center text-xs font-black text-white">
						{number || initials || "?"}
					</span>
				</div>
				<span className="absolute inset-x-0 top-[3.1rem] truncate rounded-md bg-slate-950/85 px-1.5 py-0.5 text-center text-[9px] font-bold leading-4 text-white shadow-xl">
					{name}
				</span>
			</div>
		);
	}

	return (
		<div className="pointer-events-none flex items-center gap-2">
			<div
				className={`flex h-14 w-14 cursor-grabbing items-center justify-center rounded-full border-2 text-xs font-black shadow-2xl ring-4 ${
					variant === "bench"
						? "border-yellow-200 bg-yellow-400 text-slate-950 ring-yellow-100"
						: variant === "available"
							? "border-white bg-slate-800 text-white ring-slate-200"
							: "border-white bg-blue-700 text-white ring-blue-200"
				}`}
			>
				{initials || "?"}
			</div>

			<div className="max-w-[180px] rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xl">
				<p className="truncate">{name}</p>
				<p className="text-[10px] font-medium text-slate-500">{label}</p>
			</div>
		</div>
	);
}
