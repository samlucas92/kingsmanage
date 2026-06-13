import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const rootDirectory = process.cwd();
const temporaryDirectory = path.join(rootDirectory, ".seed-export-temp");
const outputDirectory = path.join(rootDirectory, "seed-data");
const entryFilePath = path.join(temporaryDirectory, "seed-export-entry.ts");
const bundledFilePath = path.join(temporaryDirectory, "seed-export-bundle.mjs");
const seedFinancePath = path.join(rootDirectory, "src", "data", "seedFinance.ts");

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

const hasSeedFinance = await fileExists(seedFinancePath);

await fs.writeFile(
	entryFilePath,
	`
		import { seedPlayers } from "../src/data/seedPlayers";
		import { seedMatches } from "../src/data/seedMatches";
		import { seedSeasons } from "../src/data/seedSeasons";
		import { getPreSeasonPlayerStats } from "../src/data/preSeasonPlayerStats";
		${hasSeedFinance ? 'import * as seedFinanceModule from "../src/data/seedFinance";' : ""}

		const financeRecords = ${hasSeedFinance ? "getFinanceRecords(seedFinanceModule)" : "[]"};

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
			financeRecords,
		};

		function getFinanceRecords(module) {
			const possibleExports = [
				module.seedFinanceRecords,
				module.seedFinance,
				module.playerFinanceRecords,
				module.default,
			];

			const financeRecords = possibleExports.find(Array.isArray) ?? [];

			return financeRecords.map((record) => ({
				playerId: record.playerId,
				seasonId: record.seasonId,
				amountOwed: record.amountOwed ?? 0,
				payments: record.payments ?? [],
			}));
		}
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
	path.join(outputDirectory, "finance-records.json"),
	JSON.stringify(seedData.financeRecords, null, "\t"),
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
console.log("- seed-data/finance-records.json");
console.log("- seed-data/all.json");

if (!hasSeedFinance) {
	console.log("No src/data/seedFinance.ts file was found, so financeRecords was exported as an empty array.");
}

async function fileExists(filePath) {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}
