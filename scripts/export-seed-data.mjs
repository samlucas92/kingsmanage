import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const rootDirectory = process.cwd();
const temporaryDirectory = path.join(rootDirectory, ".seed-export-temp");
const outputDirectory = path.join(rootDirectory, "seed-data");
const entryFilePath = path.join(temporaryDirectory, "seed-export-entry.ts");
const bundledFilePath = path.join(temporaryDirectory, "seed-export-bundle.mjs");

await fs.rm(temporaryDirectory, {
	recursive: true,
	force: true,
});
await fs.mkdir(temporaryDirectory, {
	recursive: true,
});
await fs.mkdir(outputDirectory, {
	recursive: true,
});

await fs.writeFile(
	entryFilePath,
	`
		import { seedPlayers } from "../src/data/seedPlayers";
		import { seedMatches } from "../src/data/seedMatches";
		import { seedSeasons } from "../src/data/seedSeasons";
		import { getPreSeasonPlayerStats } from "../src/data/preSeasonPlayerStats";

		export const seedData = {
			players: seedPlayers,
			matches: seedMatches,
			seasons: seedSeasons,
			historicalStats: seedPlayers.map((player) => {
				const stats = getPreSeasonPlayerStats(player.name);

				return {
					playerId: player.id,
					name: player.name,
					appearances: stats.appearances,
					goals: stats.goals,
				};
			}),
		};
	`,
	"utf8"
);

await build({
	entryPoints: [entryFilePath],
	bundle: true,
	format: "esm",
	platform: "node",
	outfile: bundledFilePath,
	logLevel: "silent",
});

const bundledModule = await import(pathToFileURL(bundledFilePath).href);
const seedData = bundledModule.seedData;

await fs.writeFile(
	path.join(outputDirectory, "players.json"),
	JSON.stringify(seedData.players, null, "\t"),
	"utf8"
);
await fs.writeFile(
	path.join(outputDirectory, "matches.json"),
	JSON.stringify(seedData.matches, null, "\t"),
	"utf8"
);
await fs.writeFile(
	path.join(outputDirectory, "seasons.json"),
	JSON.stringify(seedData.seasons, null, "\t"),
	"utf8"
);
await fs.writeFile(
	path.join(outputDirectory, "historical-stats.json"),
	JSON.stringify(seedData.historicalStats, null, "\t"),
	"utf8"
);
await fs.writeFile(
	path.join(outputDirectory, "all.json"),
	JSON.stringify(seedData, null, "\t"),
	"utf8"
);

await fs.rm(temporaryDirectory, {
	recursive: true,
	force: true,
});

console.log("Seed data exported:");
console.log("- seed-data/players.json");
console.log("- seed-data/matches.json");
console.log("- seed-data/seasons.json");
console.log("- seed-data/historical-stats.json");
console.log("- seed-data/all.json");
