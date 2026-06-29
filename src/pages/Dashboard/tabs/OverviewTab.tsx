import MetricCard from "../../../components/compositions/MetricCard";
import QuickActionCard from "../../../components/compositions/QuickActionCard";
import type { Match } from "../../../stores/match";
import { formatCurrency } from "../../../utils/format";
import AttentionCard from "../components/AttentionCard";
import MatchPreview from "../components/MatchPreview";
import LatestMessagesCard from "../components/LatestMessagesCard";
import MobileManagerOverview from "../components/MobileManagerOverview";

export default function OverviewTab({
	activePlayersCount,
	financeOutstanding,
	financePaidPercentage,
	availability,
	inactivePlayersCount,
	isAdmin,
	latestCompletedMatch,
	nextMatch,
	playersOwingCount,
	recentMatches,
	unlockedUpcomingMatchesCount,
	upcomingEventsCount,
	upcomingMatchesCount,
}: {
	activePlayersCount: number;
	completedMatchesCount: number;
	financeOutstanding: number;
	financePaidPercentage: number;
	availability: {
		available: number;
		declined: number;
		unanswered: number;
	};
	inactivePlayersCount: number;
	isAdmin: boolean;
	latestCompletedMatch?: Match;
	nextMatch?: Match;
	playersOwingCount: number;
	recentMatches: Match[];
	postponedMatchesCount: number;
	unlockedUpcomingMatchesCount: number;
	upcomingEventsCount: number;
	upcomingMatchesCount: number;
}) {
	return (
		<>
			<MobileManagerOverview
				availability={availability}
				financeOutstanding={financeOutstanding}
				isAdmin={isAdmin}
				nextMatch={nextMatch}
				recentMatches={recentMatches}
			/>

		<div className="hidden space-y-6 lg:block">
			<div className={`grid gap-5 ${isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
				<MetricCard
					label="Active players"
					value={activePlayersCount}
					helper={`${inactivePlayersCount} inactive`}
				/>

				<MetricCard
					label="Upcoming matches"
					value={upcomingMatchesCount}
					helper={`${unlockedUpcomingMatchesCount} lineups still unlocked`}
				/>

				<MetricCard
					label="Upcoming events"
					value={upcomingEventsCount}
					helper="Events are season-agnostic"
				/>

				{isAdmin && (
					<MetricCard
						label="Outstanding finance"
						value={formatCurrency(financeOutstanding)}
						helper={`${playersOwingCount} players owing · ${financePaidPercentage}% paid`}
						tone={financeOutstanding > 0 ? "danger" : "success"}
					/>
				)}
			</div>

			<div className="grid gap-5 lg:grid-cols-3">
				<AttentionCard title="Next fixture" tone={nextMatch ? "neutral" : "muted"}>
					{nextMatch ? (
						<MatchPreview match={nextMatch} />
					) : (
						<p className="text-sm text-slate-500">No upcoming fixtures in the active season.</p>
					)}
				</AttentionCard>

				<AttentionCard title="Latest result" tone={latestCompletedMatch ? "neutral" : "muted"}>
					{latestCompletedMatch ? (
						<MatchPreview match={latestCompletedMatch} showResult />
					) : (
						<p className="text-sm text-slate-500">No completed results in the active season.</p>
					)}
				</AttentionCard>

				{isAdmin ? (
					<AttentionCard
						title="Finance attention"
						tone={financeOutstanding > 0 ? "danger" : "good"}
					>
						<p className={`text-2xl font-bold ${financeOutstanding > 0 ? "text-red-700" : "text-green-700"}`}>
							{formatCurrency(financeOutstanding)}
						</p>

						<p className="mt-2 text-sm text-slate-600">
							Outstanding from {playersOwingCount} {playersOwingCount === 1 ? "player" : "players"}.
						</p>
					</AttentionCard>
				) : (
					<AttentionCard title="Coach focus" tone="neutral">
						<p className="text-sm text-slate-600">
							Finance and user administration are hidden from coach accounts.
						</p>
					</AttentionCard>
				)}
			</div>

			<LatestMessagesCard />

			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="mb-4">
					<h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
					<p className="text-sm text-slate-500">Common management tasks.</p>
				</div>

				<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
					<QuickActionCard
						title="Open matches"
						description="Review fixtures, lineups, and results."
						to="/matches"
					/>

					<QuickActionCard
						title="Manage players"
						description="Update player details and active status."
						to="/players"
					/>

					<QuickActionCard
						title="View stats"
						description="Check season stats and totals."
						to="/stats"
					/>

					{isAdmin && (
						<QuickActionCard
							title="Open finance"
							description="Review balances and payments."
							to="/finance"
						/>
					)}
				</div>
			</section>
		</div>
		</>
	);
}
