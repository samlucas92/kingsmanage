export type DragType = "available" | "selected";

export type DragData = {
	type: DragType;
	playerId: string;
};

export type DropData = {
	type: "player";
	playerId: string;
	area: "available" | "pitch" | "bench";
};

export type FormationPosition = {
	key: string;
	x: number;
	y: number;
	label: string;
};

export type OpenPlayerMenu = {
	playerId: string;
	left: number;
	top: number;
};
