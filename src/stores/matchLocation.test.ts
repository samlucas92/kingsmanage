import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMatch = vi.hoisted(() => vi.fn());

vi.mock("../services/matchApi", () => ({
	matchApi: {
		updateMatch,
	},
}));

import { useMatchStore, type Match } from "./match";

describe("match fixture updates", () => {
	beforeEach(() => {
		updateMatch.mockReset();
		const match: Match = {
			id: "match-1",
			seasonId: "season-1",
			team: "team-1",
			opponent: "Rovers",
			competition: "League",
			date: "2026-07-01T14:00:00.000Z",
			venue: "home",
			location: "Old Ground",
			state: "upcoming",
			isCompleted: false,
			isLineupLocked: false,
			selectedFormation: "4-3-3",
			postponements: [],
			selectedPlayers: [],
			isDetailLoaded: true,
		};
		updateMatch.mockImplementation(async (_id: string, updated: Match) => updated);
		useMatchStore.setState({ matches: [match] });
	});

	it("persists location and competition when editing a fixture", async () => {
		await useMatchStore.getState().updateMatchFixture("match-1", {
			seasonId: "season-1",
			team: "team-1",
			opponent: "Rovers",
			competition: "Open Cup",
			date: "2026-07-01T15:00:00.000Z",
			venue: "away",
			location: "New Ground, Swansea",
		});

		expect(updateMatch).toHaveBeenCalledWith(
			"match-1",
			expect.objectContaining({
				competition: "Open Cup",
				location: "New Ground, Swansea",
			})
		);
		expect(useMatchStore.getState().matches[0]).toMatchObject({
			competition: "Open Cup",
			location: "New Ground, Swansea",
		});
	});

	it("allows fixture metadata to be corrected for completed matches", async () => {
		useMatchStore.setState((state) => ({
			matches: state.matches.map((match) => ({
				...match,
				state: "won",
				isCompleted: true,
				result: { homeGoals: 2, awayGoals: 1 },
			})),
		}));

		await useMatchStore.getState().updateMatchFixture("match-1", {
			seasonId: "season-1",
			team: "team-1",
			opponent: "Rovers",
			competition: "League",
			date: "2026-07-01T14:00:00.000Z",
			venue: "away",
			location: "Old Ground",
		});

		expect(updateMatch).toHaveBeenCalledWith(
			"match-1",
			expect.objectContaining({
				isCompleted: true,
				result: { homeGoals: 2, awayGoals: 1 },
				venue: "away",
			})
		);
		expect(useMatchStore.getState().matches[0]).toMatchObject({
			isCompleted: true,
			venue: "away",
		});
	});
});
