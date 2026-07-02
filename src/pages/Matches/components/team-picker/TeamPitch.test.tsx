import { DndContext } from "@dnd-kit/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TeamPitch } from "./TeamPitch";
import { DragOverlayPlayer } from "./PlayerCards";

const formation = [{ key: "gk", label: "GK", x: 50, y: 80 }];

describe("TeamPitch responsive controls", () => {
	it("renders an actionable shirt marker for an empty position", () => {
		const html = renderToStaticMarkup(
			<DndContext>
				<TeamPitch
					pitchRef={{ current: null }}
					isOverPitch={false}
					formation={formation}
					surface="football-pitch"
					hoveredFormationIndex={null}
					hoveredSwapTargetPlayerId={null}
					pitchPlayers={[]}
					isLineupLocked={false}
					getPositionOccupant={() => undefined}
					getPlayerName={() => "Unknown"}
					getPlayerNumber={() => undefined}
					getPlayerPositions={() => []}
					getPlayerInitials={() => "U"}
					onOpenPlayerMenu={() => undefined}
					onOpenMobilePositionSelector={() => undefined}
				/>
			</DndContext>
		);

		expect(html).toContain('aria-label="Select player for GK"');
		expect(html).toContain(">+</span>");
		expect(html).toContain("<svg");
		expect(html).not.toContain('aria-label="Select player for GK" disabled');
	});

	it("renders a numbered shirt with a visible player name", () => {
		const selected = {
			playerId: "player-1",
			area: "pitch" as const,
			positionKey: "gk",
			positionIndex: 0,
		};
		const html = renderToStaticMarkup(
			<DndContext>
				<TeamPitch
					pitchRef={{ current: null }}
					isOverPitch={false}
					formation={formation}
					surface="football-pitch"
					hoveredFormationIndex={null}
					hoveredSwapTargetPlayerId={null}
					pitchPlayers={[selected]}
					isLineupLocked={false}
					getPositionOccupant={() => selected}
					getPlayerName={() => "Alex Morgan"}
					getPlayerNumber={() => 9}
					getPlayerPositions={() => ["GK"]}
					getPlayerInitials={() => "AM"}
					onOpenPlayerMenu={() => undefined}
					onOpenMobilePositionSelector={() => undefined}
				/>
			</DndContext>
		);

		expect(html).toContain('data-testid="pitch-player-shirt"');
		expect(html).toContain(">9</span>");
		expect(html).toContain("Alex Morgan");
		expect(html).toContain('aria-label="Open actions for Alex Morgan"');
		expect(html).not.toContain('aria-label="Select player for GK"');
	});

	it("keeps the shirt treatment while dragging a pitch player", () => {
		const html = renderToStaticMarkup(
			<DragOverlayPlayer
				name="Alex Morgan"
				initials="AM"
				number={9}
				variant="pitch"
			/>
		);

		expect(html).toContain('data-testid="drag-overlay-shirt"');
		expect(html).toContain(">9</span>");
		expect(html).toContain("Alex Morgan");
	});
});
