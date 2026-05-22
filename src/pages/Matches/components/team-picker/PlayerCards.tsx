import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { MouseEvent } from "react";
import type { DragData } from "./Types";

interface AvailablePlayerProps {
	id: string;
	name: string;
	disabled: boolean;
	isMenuOpen: boolean;
	onOpenMenu: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function AvailablePlayer({
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
	isOutOfPosition,
	preferredPositions,
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

	const title = isOutOfPosition
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
			className={`absolute z-20 flex h-12 w-12 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg ${
				isMenuOpen
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
				{initials}
			</button>

			{isOutOfPosition && (
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
	disabled: boolean;
	isMenuOpen: boolean;
	onOpenMenu: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function BenchPlayer({
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

interface DragOverlayPlayerProps {
	name: string;
}

export function DragOverlayPlayer({ name }: DragOverlayPlayerProps) {
	return (
		<div className="cursor-grabbing rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-xl">
			{name}
		</div>
	);
}