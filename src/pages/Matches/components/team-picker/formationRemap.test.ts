import { describe, expect, it } from "vitest";
import { sportDefinitions } from "../../../../constants/sports";
import type { SelectedPlayer } from "../../../../stores/match";
import { remapPitchPlayersToFormation } from "./formationRemap";

const football = sportDefinitions.football.formations;
const fourFourTwo = football.find((formation) => formation.key === "4-4-2")!;
const fourThreeThree = football.find((formation) => formation.key === "4-3-3")!;
const fourFiveOne = football.find((formation) => formation.key === "4-5-1")!;

function selectedPlayer(playerId: string, positionIndex: number): SelectedPlayer {
	return {
		playerId,
		area: "pitch",
		positionIndex,
		positionKey: fourFourTwo.slots[positionIndex].key,
	};
}

describe("formation player remapping", () => {
	it("keeps players in predictable tactical and lateral positions", () => {
		const players = fourFourTwo.slots.map((_, index) =>
			selectedPlayer(`player-${index}`, index)
		);
		const positions: Record<string, string[]> = {
			"player-0": ["GK"],
			"player-1": ["LB"],
			"player-2": ["CB"],
			"player-3": ["CB"],
			"player-4": ["RB"],
			"player-5": ["LM"],
			"player-6": ["CM"],
			"player-7": ["CM"],
			"player-8": ["RM"],
			"player-9": ["ST"],
			"player-10": ["ST"],
		};

		const remapped = remapPitchPlayersToFormation(
			players,
			fourFourTwo.slots,
			fourFiveOne.slots,
			(playerId) => positions[playerId]
		);

		expect(remapped.find((player) => player.playerId === "player-0")?.positionKey).toBe("gk");
		expect(remapped.find((player) => player.playerId === "player-1")?.positionKey).toBe("lb");
		expect(remapped.find((player) => player.playerId === "player-4")?.positionKey).toBe("rb");
		expect(remapped.find((player) => player.playerId === "player-5")?.positionKey).toBe("lm");
		expect(remapped.find((player) => player.playerId === "player-8")?.positionKey).toBe("rm");
		expect(
			remapped.filter((player) => ["player-9", "player-10"].includes(player.playerId))
				.map((player) => player.positionKey)
		).toContain("st");
	});

	it("produces the same assignment regardless of selection order", () => {
		const players = fourFourTwo.slots.map((_, index) =>
			selectedPlayer(`player-${index}`, index)
		);
		const positions = (playerId: string) => {
			const index = Number(playerId.split("-")[1]);
			return [fourFourTwo.slots[index].label];
		};

		const original = remapPitchPlayersToFormation(
			players,
			fourFourTwo.slots,
			fourThreeThree.slots,
			positions
		);
		const reversed = remapPitchPlayersToFormation(
			[...players].reverse(),
			fourFourTwo.slots,
			fourThreeThree.slots,
			positions
		);

		expect(Object.fromEntries(original.map((player) => [player.playerId, player.positionKey])))
			.toEqual(Object.fromEntries(reversed.map((player) => [player.playerId, player.positionKey])));
	});
});
