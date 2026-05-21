import type { LineupFormation } from "../../../../stores/match";
import type { FormationPosition } from "./Types";

export const formations: Record<LineupFormation, FormationPosition[]> = {
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