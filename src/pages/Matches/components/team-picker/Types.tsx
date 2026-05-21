export type DragType = "available" | "selected";

export type DragData = {
  type: DragType;
  playerId: string;
};

export type FormationPosition = {
  x: number;
  y: number;
  label: string;
};

export type OpenPlayerMenu = {
  playerId: string;
  left: number;
  top: number;
};