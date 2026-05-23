import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { MouseEvent } from "react";
import type { DragData, DropData } from "./Types";

interface AvailablePlayerProps {
	id: string;
	name: string;
	disabled: boolean;
	isMenuOpen: boolean;
	isSwapTarget?: boolean;
	onOpenMenu: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function AvailablePlayer({
	id,
	name,
	disabled,
	isMenuOpen,
	isSwapTarget = false,
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
	isSwapTarget: boolean;
	isOutOfPosition: boolean;
	preferredPositions: string[];
	onOpenMenu: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function SelectedPitchPlayer({
	playerId,
	name,
	initials,
	x,
	y,
	disabled,
	isMenuOpen,
	isSwapTarget,
	isOutOfPosition,
	preferredPositions,
	onOpenMenu,
}: SelectedPitchPlayerProps) {
	const {
		attributes,
		listeners,
		setNodeRef: setDraggableNodeRef,
		transform,
		isDragging,
	} = useDraggable({
		id: `selected-${playerId}`,
		disabled,
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
			className={`absolute z-20 flex h-12 w-12 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg transition ${
				isSwapTarget
					? "scale-110 border-yellow-300 bg-yellow-300 text-slate-900 ring-4 ring-yellow-200"
					: isMenuOpen
						? "border-yellow-300 bg-yellow-300 text-slate-900"
						: isOutOfPosition
							? "border-amber-300 bg-amber-500 text-white"
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
				{isSwapTarget ? "↔" : initials}
			</button>

			{isOutOfPosition && !isSwapTarget && (
				<span className="pointer-events-none absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-amber-100 text-[10px] font-bold text-amber-800 shadow">
					!
				</span>
			)}

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
				className={`shrink-0 text-slate-500 ${
					disabled ? "cursor-default" : "cursor-grab"
				}`}
				aria-label={`Move ${name}`}
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
					className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-blue-800 ${
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
	variant: "available" | "pitch" | "bench";
}

export function DragOverlayPlayer({
	name,
	initials,
	variant,
}: DragOverlayPlayerProps) {
	const label =
		variant === "pitch"
			? "Pitch player"
			: variant === "bench"
				? "Bench player"
				: "Available player";

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