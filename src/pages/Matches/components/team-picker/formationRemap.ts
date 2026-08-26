import type { FormationSlot } from "../../../../constants/sports";
import { isPositionCompatible, normalisePosition } from "./PositionCompatibility";
import type { SelectedPlayer } from "../../../../stores/match";

type PositionedPlayer = {
	player: SelectedPlayer;
	source: FormationSlot;
	originalIndex: number;
};

type Assignment = {
	cost: number;
	targetIndexes: number[];
};

export function remapPitchPlayersToFormation(
	players: SelectedPlayer[],
	sourceFormation: FormationSlot[],
	targetFormation: FormationSlot[],
	getPlayerPositions: (playerId: string) => string[]
) {
	const positionedPlayers = players
		.map((player, originalIndex) => ({
			player,
			source: resolveSourceSlot(player, sourceFormation, originalIndex),
			originalIndex,
		}))
		.sort(comparePositionedPlayers);
	const assignablePlayers = positionedPlayers.slice(0, targetFormation.length);
	const assignment = findBestAssignment(
		assignablePlayers,
		targetFormation,
		getPlayerPositions
	);
	const targetIndexByPlayerId = new Map(
		assignablePlayers.map((entry, index) => [
			entry.player.playerId,
			assignment[index],
		])
	);

	return players.map((player) => {
		const targetIndex = targetIndexByPlayerId.get(player.playerId);
		const target = targetIndex === undefined
			? undefined
			: targetFormation[targetIndex];

		if (!target) {
			return {
				...player,
				area: "bench" as const,
				x: undefined,
				y: undefined,
				positionIndex: undefined,
				positionKey: undefined,
			};
		}

		return {
			...player,
			x: undefined,
			y: undefined,
			positionKey: target.key,
			positionIndex: targetIndex,
		};
	});
}

function resolveSourceSlot(
	player: SelectedPlayer,
	formation: FormationSlot[],
	fallbackIndex: number
) {
	const keyedSlot = player.positionKey
		? formation.find((slot) => slot.key === player.positionKey)
		: undefined;
	if (keyedSlot) return keyedSlot;

	if (player.positionIndex !== undefined && formation[player.positionIndex]) {
		return formation[player.positionIndex];
	}

	if (player.x !== undefined && player.y !== undefined) {
		const playerPosition = { x: player.x, y: player.y };
		return formation.reduce((closest, slot) =>
			distanceSquared(slot, playerPosition) <
			distanceSquared(closest, playerPosition)
				? slot
				: closest
		);
	}

	return formation[fallbackIndex] ?? formation[0];
}

function comparePositionedPlayers(first: PositionedPlayer, second: PositionedPlayer) {
	return (
		second.source.y - first.source.y ||
		first.source.x - second.source.x ||
		first.player.playerId.localeCompare(second.player.playerId) ||
		first.originalIndex - second.originalIndex
	);
}

function findBestAssignment(
	players: PositionedPlayer[],
	targets: FormationSlot[],
	getPlayerPositions: (playerId: string) => string[]
) {
	const memo = new Map<string, Assignment>();

	function visit(playerIndex: number, usedTargets: number): Assignment {
		if (playerIndex === players.length) {
			return { cost: 0, targetIndexes: [] };
		}

		const memoKey = `${playerIndex}:${usedTargets}`;
		const cached = memo.get(memoKey);
		if (cached) return cached;

		let best: Assignment | undefined;
		for (let targetIndex = 0; targetIndex < targets.length; targetIndex += 1) {
			if (usedTargets & (1 << targetIndex)) continue;

			const remainder = visit(
				playerIndex + 1,
				usedTargets | (1 << targetIndex)
			);
			const candidate = {
				cost:
					getAssignmentCost(
						players[playerIndex],
						targets[targetIndex],
						getPlayerPositions(players[playerIndex].player.playerId)
					) + remainder.cost,
				targetIndexes: [targetIndex, ...remainder.targetIndexes],
			};

			if (!best || compareAssignments(candidate, best) < 0) {
				best = candidate;
			}
		}

		const result = best ?? { cost: 0, targetIndexes: [] };
		memo.set(memoKey, result);
		return result;
	}

	return visit(0, 0).targetIndexes;
}

function getAssignmentCost(
	player: PositionedPlayer,
	target: FormationSlot,
	playerPositions: string[]
) {
	return (
		getRoleChangePenalty(player.source, target) +
		getPlayerFitPenalty(playerPositions, target.label) +
		distanceSquared(player.source, target)
	);
}

function getRoleChangePenalty(source: FormationSlot, target: FormationSlot) {
	const sourceLabel = normalisePosition(source.label);
	const targetLabel = normalisePosition(target.label);
	if (sourceLabel === targetLabel) return 0;
	if (sourceLabel === "GK" || targetLabel === "GK") return 1_000_000;
	if (
		isPositionCompatible([sourceLabel], targetLabel) ||
		isPositionCompatible([targetLabel], sourceLabel)
	) {
		return 8_000;
	}

	const bandDifference = Math.abs(getTacticalBand(source) - getTacticalBand(target));
	return bandDifference === 0 ? 20_000 : bandDifference === 1 ? 80_000 : 180_000;
}

function getPlayerFitPenalty(playerPositions: string[], targetLabel: string) {
	const target = normalisePosition(targetLabel);
	if (playerPositions.some((position) => normalisePosition(position) === target)) {
		return -4_000;
	}
	return isPositionCompatible(playerPositions, target) ? -1_500 : 2_000;
}

function getTacticalBand(slot: FormationSlot) {
	if (normalisePosition(slot.label) === "GK") return 3;
	if (slot.y >= 60) return 2;
	if (slot.y >= 35) return 1;
	return 0;
}

function distanceSquared(
	first: Pick<FormationSlot, "x" | "y">,
	second: Pick<FormationSlot, "x" | "y">
) {
	return (first.x - second.x) ** 2 + (first.y - second.y) ** 2;
}

function compareAssignments(first: Assignment, second: Assignment) {
	if (first.cost !== second.cost) return first.cost - second.cost;
	for (let index = 0; index < first.targetIndexes.length; index += 1) {
		const difference = first.targetIndexes[index] - second.targetIndexes[index];
		if (difference !== 0) return difference;
	}
	return 0;
}
