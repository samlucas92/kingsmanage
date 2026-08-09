import { useRef } from "react";

import type {
	TemplateElementBounds,
	UpcomingTemplateElement,
	UpcomingTemplateElementId,
} from "./upcomingTemplateElements";

type TemplateCanvasOverlayProps = {
	canvasWidth: number;
	canvasHeight: number;
	elements: UpcomingTemplateElement[];
	selectedId: UpcomingTemplateElementId | null;
	onSelect: (elementId: UpcomingTemplateElementId) => void;
	onChangeStart: () => void;
	onChange: (
		elementId: UpcomingTemplateElementId,
		bounds: TemplateElementBounds
	) => void;
	onChangeEnd: () => void;
};

type DragState = {
	element: UpcomingTemplateElement;
	mode: "move" | "resize";
	startClientX: number;
	startClientY: number;
	scaleX: number;
	scaleY: number;
};

export function TemplateCanvasOverlay({
	canvasWidth,
	canvasHeight,
	elements,
	selectedId,
	onSelect,
	onChangeStart,
	onChange,
	onChangeEnd,
}: TemplateCanvasOverlayProps) {
	const dragRef = useRef<DragState>(null);

	function handlePointerDown(
		event: React.PointerEvent<HTMLDivElement>,
		element: UpcomingTemplateElement
	) {
		if (event.button !== 0) return;
		const overlay = event.currentTarget.parentElement;
		if (!overlay) return;
		const overlayBounds = overlay.getBoundingClientRect();
		const target = event.target as HTMLElement;

		event.preventDefault();
		event.stopPropagation();
		event.currentTarget.setPointerCapture(event.pointerId);
		onSelect(element.id);
		onChangeStart();
		dragRef.current = {
			element,
			mode: target.dataset.resize === "true" ? "resize" : "move",
			startClientX: event.clientX,
			startClientY: event.clientY,
			scaleX: canvasWidth / overlayBounds.width,
			scaleY: canvasHeight / overlayBounds.height,
		};
	}

	function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
		const drag = dragRef.current;
		if (!drag) return;
		const deltaX = (event.clientX - drag.startClientX) * drag.scaleX;
		const deltaY = (event.clientY - drag.startClientY) * drag.scaleY;
		const bounds = drag.mode === "move"
			? clampMovedBounds(drag.element, deltaX, deltaY, canvasWidth, canvasHeight)
			: clampResizedBounds(drag.element, deltaX, deltaY, canvasWidth, canvasHeight);

		onChange(drag.element.id, roundBounds(bounds));
	}

	function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
		if (!dragRef.current) return;
		dragRef.current = null;
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		onChangeEnd();
	}

	function handleKeyDown(
		event: React.KeyboardEvent<HTMLDivElement>,
		element: UpcomingTemplateElement
	) {
		const direction = getArrowDirection(event.key);
		if (!direction) return;
		event.preventDefault();
		const amount = event.shiftKey ? 10 : 1;
		const bounds = clampMovedBounds(
			element,
			direction.x * amount,
			direction.y * amount,
			canvasWidth,
			canvasHeight
		);
		onSelect(element.id);
		onChangeStart();
		onChange(element.id, roundBounds(bounds));
		onChangeEnd();
	}

	return (
		<div
			className="absolute inset-0 z-10 overflow-hidden"
			aria-label="Editable template elements"
		>
			{elements.map((element) => {
				const isSelected = selectedId === element.id;
				return (
					<div
						key={element.id}
						role="button"
						tabIndex={0}
						aria-label={`Edit ${element.label}`}
						aria-pressed={isSelected}
						onPointerDown={(event) => handlePointerDown(event, element)}
						onPointerMove={handlePointerMove}
						onPointerUp={handlePointerEnd}
						onPointerCancel={handlePointerEnd}
						onKeyDown={(event) => handleKeyDown(event, element)}
						className={`group absolute touch-none select-none outline-none transition-colors ${
							isSelected
								? "cursor-move border-2 border-sky-400 bg-sky-400/10 shadow-[0_0_0_1px_rgba(255,255,255,.9)]"
								: "cursor-pointer border border-dashed border-white/40 hover:border-white/90 hover:bg-white/10 focus:border-white"
						}`}
						style={{
							left: `${element.x / canvasWidth * 100}%`,
							top: `${element.y / canvasHeight * 100}%`,
							width: `${element.width / canvasWidth * 100}%`,
							height: `${element.height / canvasHeight * 100}%`,
						}}
					>
						<span className={`absolute left-0 top-0 max-w-full -translate-y-full truncate rounded-t-md px-2 py-1 text-[10px] font-bold text-white ${
							isSelected ? "bg-sky-500" : "hidden bg-slate-900/85 group-hover:block group-focus:block"
						}`}>
							{element.label}
						</span>
						{isSelected && (
							<span
								data-resize="true"
								className="absolute bottom-0 right-0 h-4 w-4 translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-sm border-2 border-white bg-sky-500 shadow"
								aria-hidden="true"
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}

function clampMovedBounds(
	element: UpcomingTemplateElement,
	deltaX: number,
	deltaY: number,
	canvasWidth: number,
	canvasHeight: number
): TemplateElementBounds {
	return {
		x: clamp(element.x + deltaX, 0, canvasWidth - element.width),
		y: clamp(element.y + deltaY, 0, canvasHeight - element.height),
		width: element.width,
		height: element.height,
	};
}

function clampResizedBounds(
	element: UpcomingTemplateElement,
	deltaX: number,
	deltaY: number,
	canvasWidth: number,
	canvasHeight: number
): TemplateElementBounds {
	return {
		x: element.x,
		y: element.y,
		width: clamp(
			element.width + deltaX,
			element.minimumWidth,
			canvasWidth - element.x
		),
		height: clamp(
			element.height + deltaY,
			element.minimumHeight,
			canvasHeight - element.y
		),
	};
}

function getArrowDirection(key: string) {
	switch (key) {
		case "ArrowLeft":
			return { x: -1, y: 0 };
		case "ArrowRight":
			return { x: 1, y: 0 };
		case "ArrowUp":
			return { x: 0, y: -1 };
		case "ArrowDown":
			return { x: 0, y: 1 };
		default:
			return null;
	}
}

function clamp(value: number, minimum: number, maximum: number) {
	return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function roundBounds(bounds: TemplateElementBounds): TemplateElementBounds {
	return {
		x: Math.round(bounds.x * 10) / 10,
		y: Math.round(bounds.y * 10) / 10,
		width: Math.round(bounds.width * 10) / 10,
		height: Math.round(bounds.height * 10) / 10,
	};
}
