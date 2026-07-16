import Stats from "../../../Stats/Stats";
import ReportBarChart from "../../components/charts/ReportBarChart";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportMetricCard from "../../components/ReportMetricCard";
import ReportPageHeader from "../../components/ReportPageHeader";
import { useReportsContext } from "../../ReportsContext";
import { useStatsStore } from "../../../../stores/stats";

export default function PlayerStatsReport() {
	const { selectedSeasonId, setSelectedSeasonId, selectedPlayerId } = useReportsContext();
	const seasonStats = useStatsStore((state) => state.seasonStats);
	const filteredStats = seasonStats.filter((playerStats) => {
		if (!playerStats.isActive) {
			return false;
		}

		return selectedPlayerId === "all" || playerStats.playerId === selectedPlayerId;
	});
	const totalGoals = filteredStats.reduce((total, playerStats) => total + playerStats.seasonGoals, 0);
	const totalAssists = filteredStats.reduce((total, playerStats) => total + playerStats.assists, 0);
	const totalAppearances = filteredStats.reduce((total, playerStats) => total + playerStats.seasonApps, 0);
	const totalContributions = totalGoals + totalAssists;
	const topContributors = [...filteredStats]
		.map((playerStats) => ({
			...playerStats,
			contributions: playerStats.seasonGoals + playerStats.assists,
		}))
		.filter((playerStats) => playerStats.contributions > 0 || playerStats.seasonApps > 0)
		.sort((firstPlayer, secondPlayer) =>
			secondPlayer.contributions - firstPlayer.contributions ||
			secondPlayer.seasonApps - firstPlayer.seasonApps ||
			firstPlayer.playerName.localeCompare(secondPlayer.playerName)
		)
		.slice(0, 8);

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Player Stats"
				description="Goals, assists, appearances and match records."
				showTeamFilter={false}
				showPlayerFilter
			/>
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<ReportMetricCard label="Active players" value={filteredStats.length} />
				<ReportMetricCard label="Appearances" value={totalAppearances} />
				<ReportMetricCard label="Goals" value={totalGoals} tone={totalGoals > 0 ? "success" : "default"} />
				<ReportMetricCard label="Goal contributions" value={totalContributions} helper={`${totalAssists} assists`} />
			</div>
			<ReportChartContainer
				title="Top player contributions"
				description="Goals and assists for the selected player filter."
				isEmpty={topContributors.length === 0}
			>
				<ReportBarChart
					ariaLabel="Top player goals and assists"
					labels={topContributors.map((playerStats) => shortName(playerStats.playerName))}
					series={[
						{
							label: "Goals",
							colour: "#147764",
							values: topContributors.map((playerStats) => playerStats.seasonGoals),
						},
						{
							label: "Assists",
							colour: "#2563eb",
							values: topContributors.map((playerStats) => playerStats.assists),
						},
					]}
				/>
			</ReportChartContainer>
			<Stats
				variant="report"
				selectedSeasonId={selectedSeasonId}
				onSeasonChange={setSelectedSeasonId}
				selectedPlayerId={selectedPlayerId}
				hideHeader
			/>
		</div>
	);
}

function shortName(name: string) {
	const [firstName, ...rest] = name.split(" ");
	const lastName = rest.at(-1);

	return lastName ? `${firstName[0]}. ${lastName}` : name;
}
