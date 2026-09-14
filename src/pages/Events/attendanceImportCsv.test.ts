import { describe, expect, it } from "vitest";

import type { Player } from "../../stores/players";
import {
	findBestPlayerMatch,
	parseAttendanceImportCsv,
} from "./attendanceImportCsv";

const players: Player[] = [
	player("sam", "Sam Lucas"),
	player("daniel", "Daniel Martlew"),
	player("alhadi", "Alhadi Yagob"),
	player("alex", "Alex Wilson"),
];

describe("attendance CSV import", () => {
	it("parses each attendance section and ignores guardian-only rows", () => {
		const csv = [
			"Table 1",
			"Kingsbridge Colts – Second team home,,,v.ps-2",
			"Going (2)",
			"Name,Guardian,Phone,Email",
			"Sam Lucas,,+44 123,sam@example.com",
			"Dan Martlew,,,,",
			",Jason Phillips,,guardian@example.com",
			"Unanswered (1)",
			"Name,Guardian,Phone,Email",
			"Alhadi,,,alhadi@example.com",
			"Can't go (1)",
			"Name,Guardian,Phone,Email,Decline reason",
			"Alex Wilson,,,alex@example.com,Holiday",
		].join("\n");

		const result = parseAttendanceImportCsv(csv, players);

		expect(result.fileErrors).toEqual([]);
		expect(result.rows).toHaveLength(4);
		expect(result.rows.map((row) => row.status)).toEqual([
			"Available",
			"Available",
			"Unanswered",
			"Declined",
		]);
		expect(result.rows.map((row) => row.playerId)).toEqual([
			"sam",
			"daniel",
			"alhadi",
			"alex",
		]);
	});

	it("matches common shortened and single-name variants", () => {
		expect(findBestPlayerMatch("Dan Martlew", players)?.player.id).toBe("daniel");
		expect(findBestPlayerMatch("Alhadi", players)?.player.id).toBe("alhadi");
	});

	it("does not select a weak name match", () => {
		expect(findBestPlayerMatch("Someone Else", players)).toBeNull();
	});
});

function player(id: string, name: string): Player {
	return {
		id,
		name,
		positions: [],
		appearances: 0,
		number: 0,
		isActive: true,
	};
}
