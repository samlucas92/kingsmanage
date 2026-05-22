import { Link } from "react-router-dom";
import { usePlayerStore } from "../../stores/players";
import { useMatchStore } from "../../stores/match";
import DevToolsCard from "../../components/compositions/DevToolsCard";
import { formatDisplayDateTime } from "../../utils/date";

export default function Dashboard() {
	const players = usePlayerStore((state) => state.players);
	const matches = useMatchStore((state) => state.matches);

	const activePlayers = players.filter((player) => player.isActive);
	const inactivePlayers = players.filter((player) => !player.isActive);

	const upcomingMatches = matches.filter(
		(match) => !match.isCompleted && match.state !== "postponed"
	);

	const completedMatches = matches.filter((match) => match.isCompleted);

	const postponedMatches = matches.filter(
		(match) => match.state === "postponed"
	);

	const lockedLineups = matches.filter((match) => match.isLineupLocked);

	const nextMatches = [...upcomingMatches]
		.sort(
			(firstMatch, secondMatch) =>
				new Date(firstMatch.date).getTime() -
				new Date(secondMatch.date).getTime()
		)
		.slice(0, 3);

	const latestCompletedMatches = [...completedMatches]
		.sort(
			(firstMatch, secondMatch) =>
				new Date(secondMatch.date).getTime() -
				new Date(firstMatch.date).getTime()
		)
		.slice(0, 3);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-blue-900">Dashboard</h1>

				<p className="text-gray-600">
					Overview of squad, fixtures and matchday preparation.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<DashboardStatCard
					label="Active Players"
					value={activePlayers.length}
					helper={`${players.length} total players`}
					to="/players"
				/>

				<DashboardStatCard
					label="Upcoming Matches"
					value={upcomingMatches.length}
					helper={`${postponedMatches.length} postponed`}
					to="/matches"
				/>

				<DashboardStatCard
					label="Completed Matches"
					value={completedMatches.length}
					helper="Results entered"
					to="/matches"
				/>

				<DashboardStatCard
					label="Locked Lineups"
					value={lockedLineups.length}
					helper="Teams saved"
					to="/matches"
				/>
			</div>

			<div className="grid gap-6 xl:grid-cols-2">
				<section className="rounded-xl bg-white p-6 shadow">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h2 className="text-lg font-bold text-blue-900">
								Next Fixtures
							</h2>

							<p className="text-sm text-gray-500">
								Upcoming matches that still need managing.
							</p>
						</div>

						<Link
							to="/matches"
							className="text-sm font-semibold text-blue-700 hover:text-blue-900"
						>
							View all
						</Link>
					</div>

					<div className="mt-4 space-y-3">
						{nextMatches.map((match) => (
							<Link
								key={match.id}
								to={`/matches/${match.id}`}
								className="block rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
							>
								<div className="flex items-start justify-between gap-3">
									<div>
										<p className="font-semibold text-slate-900">
											vs {match.opponent}
										</p>

										<p className="text-sm text-slate-500">
											{formatDisplayDateTime(match.date)} ·{" "}
											{match.venue}
										</p>
									</div>

									<span
										className={`rounded-full px-3 py-1 text-xs font-semibold ${
											match.isLineupLocked
												? "bg-blue-100 text-blue-800"
												: "bg-amber-100 text-amber-800"
										}`}
									>
										{match.isLineupLocked ? "Lineup saved" : "Needs team"}
									</span>
								</div>
							</Link>
						))}

						{nextMatches.length === 0 && (
							<p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
								No upcoming fixtures.
							</p>
						)}
					</div>
				</section>

				<section className="rounded-xl bg-white p-6 shadow">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h2 className="text-lg font-bold text-blue-900">
								Recent Results
							</h2>

							<p className="text-sm text-gray-500">
								Latest completed matches.
							</p>
						</div>

						<Link
							to="/matches"
							className="text-sm font-semibold text-blue-700 hover:text-blue-900"
						>
							View all
						</Link>
					</div>

					<div className="mt-4 space-y-3">
						{latestCompletedMatches.map((match) => (
							<Link
								key={match.id}
								to={`/matches/${match.id}`}
								className="block rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
							>
								<div className="flex items-start justify-between gap-3">
									<div>
										<p className="font-semibold text-slate-900">
											vs {match.opponent}
										</p>

										<p className="text-sm text-slate-500">
											{formatDisplayDateTime(match.date)} ·{" "}
											{match.venue}
										</p>
									</div>

									<div className="text-right">
										{match.result && (
											<p className="text-lg font-bold text-slate-900">
												{match.result.homeGoals} -{" "}
												{match.result.awayGoals}
											</p>
										)}

										<span
											className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
												match.state === "won"
													? "bg-green-100 text-green-800"
													: match.state === "lost"
														? "bg-red-100 text-red-800"
														: "bg-slate-100 text-slate-700"
											}`}
										>
											{match.state}
										</span>
									</div>
								</div>
							</Link>
						))}

						{latestCompletedMatches.length === 0 && (
							<p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
								No completed matches yet.
							</p>
						)}
					</div>
				</section>
			</div>

			<section className="rounded-xl bg-white p-6 shadow">
				<h2 className="text-lg font-bold text-blue-900">Squad Health</h2>

				<div className="mt-4 grid gap-4 sm:grid-cols-3">
					<div className="rounded-lg bg-green-50 p-4">
						<p className="text-sm font-medium text-green-700">Active</p>

						<p className="mt-1 text-2xl font-bold text-green-900">
							{activePlayers.length}
						</p>
					</div>

					<div className="rounded-lg bg-slate-50 p-4">
						<p className="text-sm font-medium text-slate-700">Inactive</p>

						<p className="mt-1 text-2xl font-bold text-slate-900">
							{inactivePlayers.length}
						</p>
					</div>

					<div className="rounded-lg bg-blue-50 p-4">
						<p className="text-sm font-medium text-blue-700">
							Average appearances
						</p>

						<p className="mt-1 text-2xl font-bold text-blue-900">
							{getAverageAppearances(players)}
						</p>
					</div>
				</div>
			</section>

			<DevToolsCard />
		</div>
	);
}

interface DashboardStatCardProps {
	label: string;
	value: number;
	helper: string;
	to: string;
}

function DashboardStatCard({
	label,
	value,
	helper,
	to,
}: DashboardStatCardProps) {
	return (
		<Link
			to={to}
			className="rounded-xl bg-white p-5 shadow transition hover:-translate-y-0.5 hover:shadow-md"
		>
			<p className="text-sm font-medium text-gray-500">{label}</p>

			<p className="mt-2 text-3xl font-bold text-blue-900">{value}</p>

			<p className="mt-1 text-sm text-gray-500">{helper}</p>
		</Link>
	);
}

function getAverageAppearances(players: { appearances: number }[]) {
	if (players.length === 0) {
		return 0;
	}

	const totalAppearances = players.reduce(
		(total, player) => total + player.appearances,
		0
	);

	return Math.round(totalAppearances / players.length);
}