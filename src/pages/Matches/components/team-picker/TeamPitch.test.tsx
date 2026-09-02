import { DndContext } from "@dnd-kit/core";
import {
	Children,
	isValidElement,
	type MouseEvent,
	type ReactElement,
	type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { TeamPitch } from "./TeamPitch";
import { DragOverlayPlayer, SelectedPitchPlayer } from "./PlayerCards";
import { FloatingPlayerAssignMenu } from "./FloatingPlayerAssignMenu";

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

	it("marks a player who is also selected for another same-day match", () => {
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
					getPlayerOtherSelectionLabels={() => ["Second Team vs Town · 15:00"]}
					onOpenPlayerMenu={() => undefined}
				/>
			</DndContext>
		);

		expect(html).toContain("2×");
		expect(html).toContain("Second Team vs Town");
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

	it("opens the mobile player selector when an empty position is tapped", () => {
		const onOpenMobilePositionSelector = vi.fn();
		const pitch = TeamPitch({
			pitchRef: { current: null },
			isOverPitch: false,
			formation,
			surface: "football-pitch",
			hoveredFormationIndex: null,
			hoveredSwapTargetPlayerId: null,
			pitchPlayers: [],
			isLineupLocked: false,
			getPositionOccupant: () => undefined,
			getPlayerName: () => "Unknown",
			getPlayerNumber: () => undefined,
			getPlayerPositions: () => [],
			getPlayerInitials: () => "U",
			onOpenPlayerMenu: () => undefined,
			onOpenMobilePositionSelector,
		});
		const positionButton = findElement(
			pitch,
			(element) => element.props["aria-label"] === "Select player for GK"
		);

		positionButton?.props.onClick?.();

		expect(onOpenMobilePositionSelector).toHaveBeenCalledWith(0);
	});

	it("routes an occupied shirt action to the player context menu", () => {
		const selected = {
			playerId: "player-1",
			area: "pitch" as const,
			positionKey: "gk",
			positionIndex: 0,
		};
		const onOpenPlayerMenu = vi.fn();
		const pitch = TeamPitch({
			pitchRef: { current: null },
			isOverPitch: false,
			formation,
			surface: "football-pitch",
			hoveredFormationIndex: null,
			hoveredSwapTargetPlayerId: null,
			pitchPlayers: [selected],
			isLineupLocked: false,
			getPositionOccupant: () => selected,
			getPlayerName: () => "Alex Morgan",
			getPlayerNumber: () => 9,
			getPlayerPositions: () => ["GK"],
			getPlayerInitials: () => "AM",
			onOpenPlayerMenu,
			onOpenMobilePositionSelector: () => undefined,
		});
		const selectedPlayer = findElement(
			pitch,
			(element) => element.type === SelectedPitchPlayer
		);
		const event = {} as MouseEvent<HTMLButtonElement>;

		selectedPlayer?.props.onOpenMenu?.(event);

		expect(onOpenPlayerMenu).toHaveBeenCalledWith("player-1", event);
	});

	it("assigns a player from the context menu while protecting occupied positions", () => {
		const onAssignPosition = vi.fn();
		const menu = FloatingPlayerAssignMenu({
			playerId: "player-2",
			left: 20,
			top: 20,
			formation: [
				...formation,
				{ key: "cb", label: "CB", x: 50, y: 60 },
			],
			pitchPlayers: [
				{
					playerId: "player-1",
					area: "pitch",
					positionKey: "gk",
					positionIndex: 0,
				},
			],
			getPlayerName: () => "Alex Morgan",
			getPlayerPositions: () => ["CB"],
			isPlayerRecommendedForPosition: (_playerId, label) => label === "CB",
			onAssignPosition,
			onAssignBench: () => undefined,
			onRemove: () => undefined,
			showRemove: false,
		});
		const occupiedPosition = findElement(
			menu,
			(element) =>
				element.type === "button" &&
				flattenText(element.props.children as ReactNode).includes("GK")
		);
		const emptyPosition = findElement(
			menu,
			(element) =>
				element.type === "button" &&
				flattenText(element.props.children as ReactNode).includes("CB")
		);

		expect(occupiedPosition?.props.disabled).toBe(true);
		emptyPosition?.props.onClick?.();
		expect(onAssignPosition).toHaveBeenCalledWith("player-2", 1);
	});
});

type TestElementProps = {
	children?: ReactNode;
	disabled?: boolean;
	onClick?: () => void;
	onOpenMenu?: (event: MouseEvent<HTMLButtonElement>) => void;
	"aria-label"?: string;
};

function findElement(
	node: ReactNode,
	predicate: (element: ReactElement<TestElementProps>) => boolean
): ReactElement<TestElementProps> | undefined {
	for (const child of Children.toArray(node)) {
		if (!isValidElement<TestElementProps>(child)) continue;
		if (predicate(child)) return child;
		const nested = findElement(child.props.children as ReactNode, predicate);
		if (nested) return nested;
	}
	return undefined;
}

function flattenText(node: ReactNode): string {
	return Children.toArray(node)
		.map((child) =>
			typeof child === "string" || typeof child === "number"
				? String(child)
				: isValidElement<{ children?: ReactNode }>(child)
					? flattenText(child.props.children)
					: ""
		)
		.join(" ");
}
