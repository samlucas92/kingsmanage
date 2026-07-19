import { Link } from "react-router-dom";
import ReportBarChart from "../../components/charts/ReportBarChart";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportDoughnutChart from "../../components/charts/ReportDoughnutChart";
import ReportEmptyState from "../../components/ReportEmptyState";
import ReportMetricCard from "../../components/ReportMetricCard";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportPanel from "../../components/ReportPanel";
import ReportLoadState from "../../components/ReportLoadState";
import ReportMobileRankedList from "../../components/ReportMobileRankedList";
import { useReportsContext } from "../../ReportsContext";
import { useReportResource } from "../../hooks/useReportResource";
import { reportsApi, type PlayerReportsResponse } from "../../../../services/reportsApi";

export default function SquadUsageReport() {
	const { selectedSeasonId, selectedTeamId, selectedPlayerId, includeFriendlies, isLoading, loadError } = useReportsContext();
	const { report, isLoadingReport, reportError } = useReportResource<PlayerReportsResponse>({
		canLoad: Boolean(selectedSeasonId),
		errorMessage: "Failed to load squad usage report.",
		dependencies: [includeFriendlies, selectedPlayerId, selectedSeasonId, selectedTeamId],
		load: () =>
			reportsApi.getPlayerReports({
				seasonId: selectedSeasonId,
				teamId: selectedTeamId,
				playerId: selectedPlayerId,
				includeFriendlies,
			}),
	});
	const isTeamFiltered = selectedTeamId !== "all";
	const teamUsageRows = report?.squadUsage ?? [];
	const totalMinutes = teamUsageRows.reduce((total, playerStats) => total + playerStats.minutes, 0);
	const totalStarts = teamUsageRows.reduce((total, playerStats) => total + playerStats.starts, 0);
	const totalBench = teamUsageRows.reduce((total, playerStats) => total + playerStats.bench, 0);
	const totalUnused = teamUsageRows.reduce((total, playerStats) => total + playerStats.unusedSubstitutes, 0);
	const filteredAppearances = teamUsageRows.reduce((total, playerStats) => total + playerStats.appearances, 0);
	const filteredGoals = teamUsageRows.reduce((total, playerStats) => total + playerStats.goals, 0);
	const filteredAssists = teamUsageRows.reduce((total, playerStats) => total + playerStats.assists, 0);
	const topMinutes = [...teamUsageRows].slice(0, 8);
	const topTenMinutes = [...teamUsageRows]
		.sort((firstPlayer, secondPlayer) => secondPlayer.minutes - firstPlayer.minutes)
		.slice(0, 10);
	const bottomTenMinutes = [...teamUsageRows]
		.filter((playerStats) => playerStats.minutes > 0 || playerStats.appearances > 0 || playerStats.starts > 0 || playerStats.bench > 0)
		.sort((firstPlayer, secondPlayer) => firstPlayer.minutes - secondPlayer.minutes || firstPlayer.playerName.localeCompare(secondPlayer.playerName))
		.slice(0, 10);
	const topInvolvement = [...teamUsageRows]
		.map((playerStats) => ({
			...playerStats,
			involvement: isTeamFiltered
				? playerStats.appearances
				: playerStats.starts + playerStats.bench + playerStats.unusedSubstitutes,
		}))
		.filter((playerStats) => playerStats.involvement > 0)
		.sort((firstPlayer, secondPlayer) => secondPlayer.involvement - firstPlayer.involvement)
		.slice(0, 10);

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Squad Usage"
				description="Minutes, starts and squad involvement from recorded match stats."
				showPlayerFilter
			/>

			<ReportLoadState
				error={loadError || reportError}
				isLoading={isLoading || isLoadingReport}
			/>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<ReportMetricCard label="Total minutes" value={totalMinutes.toLocaleString("en-GB")} />
				<ReportMetricCard label={isTeamFiltered ? "Appearances" : "Starts"} value={isTeamFiltered ? filteredAppearances : totalStarts} />
				<ReportMetricCard label={isTeamFiltered ? "Goals" : "Bench"} value={isTeamFiltered ? filteredGoals : totalBench} />
				<ReportMetricCard
					label={isTeamFiltered ? "Assists" : "Unused subs"}
					value={isTeamFiltered ? filteredAssists : totalUnused}
					tone={!isTeamFiltered && totalUnused > 0 ? "warning" : "default"}
				/>
			</div>

			<div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
				<ReportChartContainer
					title={isTeamFiltered ? "Team usage mix" : "Squad status mix"}
					description={isTeamFiltered ? "Appearances, goals and assists in this team." : "Starts, bench appearances and unused substitute records."}
					isEmpty={isTeamFiltered ? filteredAppearances === 0 : totalStarts + totalBench + totalUnused === 0}
				>
					<ReportDoughnutChart
						ariaLabel={isTeamFiltered ? "Team usage mix" : "Squad starts bench and unused mix"}
						centerValue={isTeamFiltered ? filteredAppearances : totalStarts + totalBench + totalUnused}
						centerLabel={isTeamFiltered ? "apps" : "records"}
						segments={isTeamFiltered
							? [
									{ label: "Appearances", value: filteredAppearances, colour: "#147764" },
									{ label: "Goals", value: filteredGoals, colour: "#2563eb" },
									{ label: "Assists", value: filteredAssists, colour: "#8b5cf6" },
								]
							: [
									{ label: "Starts", value: totalStarts, colour: "#147764" },
									{ label: "Bench", value: totalBench, colour: "#2563eb" },
									{ label: "Unused", value: totalUnused, colour: "#f59e0b" },
								]}
					/>
				</ReportChartContainer>

				<ReportChartContainer
					title="Most minutes played"
					description="Top active players by recorded minutes. On mobile this becomes top and bottom 10 lists."
					isEmpty={topMinutes.length === 0}
				>
					<div className="space-y-3 sm:hidden">
						<ReportMobileRankedList
							title="Top 10 used"
							items={topTenMinutes.map((playerStats) => ({
								id: `top-${playerStats.playerId}`,
								label: playerStats.playerName,
								value: playerStats.minutes,
								helper: `${playerStats.appearances} apps · ${playerStats.starts} starts`,
							}))}
						/>
						<ReportMobileRankedList
							title="Bottom 10 under-utilised"
							items={bottomTenMinutes.map((playerStats) => ({
								id: `bottom-${playerStats.playerId}`,
								label: playerStats.playerName,
								value: playerStats.minutes,
								helper: `${playerStats.appearances} apps · ${playerStats.starts} starts`,
							}))}
						/>
					</div>
					<div className="hidden sm:block">
						<ReportBarChart
							ariaLabel="Top players by minutes played"
							labels={topMinutes.map((playerStats) => shortName(playerStats.playerName))}
							series={[
								{
									label: "Minutes",
									colour: "#147764",
									values: topMinutes.map((playerStats) => playerStats.minutes),
								},
							]}
						/>
					</div>
				</ReportChartContainer>
			</div>

			<ReportPanel title="Squad involvement" description="Starts, bench appearances and unused substitute records.">
				{topInvolvement.length === 0 ? (
					<ReportEmptyState title="No squad usage yet" message="Usage appears after match stats have been recorded." />
				) : (
					<>
						<div className="sm:hidden">
							<ReportMobileRankedList
								items={topInvolvement.map((playerStats) => ({
									id: playerStats.playerId,
									label: playerStats.playerName,
									value: isTeamFiltered ? playerStats.appearances : playerStats.starts + playerStats.bench,
									helper: isTeamFiltered
										? `${playerStats.goals} goals · ${playerStats.assists} assists · ${playerStats.minutes} mins`
										: `${playerStats.starts} starts · ${playerStats.bench} bench · ${playerStats.minutes} mins`,
								}))}
							/>
						</div>
						<div className="hidden overflow-hidden rounded-2xl border border-slate-200 sm:block">
							<div className="grid grid-cols-[1fr_repeat(4,4.5rem)] gap-2 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
								<span>Player</span>
								<span className="text-center">{isTeamFiltered ? "Apps" : "Starts"}</span>
								<span className="text-center">{isTeamFiltered ? "Goals" : "Bench"}</span>
								<span className="text-center">{isTeamFiltered ? "Assists" : "Unused"}</span>
								<span className="text-center">Minutes</span>
							</div>
							<div className="divide-y divide-slate-100 bg-white">
								{topInvolvement.map((playerStats) => (
									<div
										key={playerStats.playerId}
										className="grid grid-cols-[1fr_repeat(4,4.5rem)] items-center gap-2 px-4 py-3 text-sm"
									>
										<Link
											to={`/players/${playerStats.playerId}`}
											className="min-w-0 truncate font-black text-slate-950 hover:text-yepset-700"
										>
											{playerStats.playerName}
										</Link>
										<span className="text-center font-black text-slate-900">{isTeamFiltered ? playerStats.appearances : playerStats.starts}</span>
										<span className="text-center font-black text-slate-900">{isTeamFiltered ? playerStats.goals : playerStats.bench}</span>
										<span className="text-center font-black text-amber-600">{isTeamFiltered ? playerStats.assists : playerStats.unusedSubstitutes}</span>
										<span className="text-center font-black text-yepset-700">{playerStats.minutes}</span>
									</div>
								))}
							</div>
						</div>
					</>
				)}
			</ReportPanel>
		</div>
	);
}

function shortName(name: string) {
	const [firstName, ...rest] = name.split(" ");
	const lastName = rest.at(-1);

	return lastName ? `${firstName[0]}. ${lastName}` : name;
}
