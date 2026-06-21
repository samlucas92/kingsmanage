import type { FormationSlot } from "../constants/sports";

export type LineupPositionSelection = {
	x?: number;
	y?: number;
	positionKey?: string;
	positionIndex?: number;
};

export type ResolvedLineupPosition = {
	x: number;
	y: number;
	slot?: FormationSlot;
	source: "custom" | "definition" | "fallback";
};

export function resolveLineupPosition(
	selection: LineupPositionSelection,
	formation: FormationSlot[]
): ResolvedLineupPosition {
	const slot = formation.find((candidate) => candidate.key === selection.positionKey)
		?? (selection.positionIndex !== undefined ? formation[selection.positionIndex] : undefined);

	if (selection.x !== undefined || selection.y !== undefined) {
		return {
			x: selection.x ?? slot?.x ?? 50,
			y: selection.y ?? slot?.y ?? 50,
			slot,
			source: "custom",
		};
	}

	if (slot) {
		return { x: slot.x, y: slot.y, slot, source: "definition" };
	}

	return { x: 50, y: 50, source: "fallback" };
}
