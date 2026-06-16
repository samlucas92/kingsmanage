import EmptyState from "../../../components/compositions/EmptyState";
import LinkButton from "../../../components/compositions/LinkButton";
import PanelCard from "../../../components/compositions/PanelCard";
import type { Match } from "../../../stores/match";
import { MatchListItem } from "../components/MatchPreview";

export default function MatchesTab({
	latestThreeResults,
	nextThreeMatches,
	postponedMatchesCount,
	unlockedUpcomingMatchesCount,
}: {
	latestThreeResults: Match[];
	nextThreeMatches: Match[];
	postponedMatchesCount: number;
	unlockedUpcomingMatchesCount: number;
}) {
	return (
		<div className="grid gap-5 lg:grid-cols-2">
			<PanelCard
				action={<DashboardLinkButton to="/matches">View all matches</DashboardLinkButton>}
				description={`${unlockedUpcomingMatchesCount} upcoming lineups still unlocked.`}
				title="Upcoming fixtures"
			>
				<div className="space-y-3">
					{nextThreeMatches.map((match) => (
						<MatchListItem key={match.id} match={match} />
					))}

					{nextThreeMatches.length === 0 && (
						<EmptyState
							title="No upcoming fixtures"
							message="No upcoming fixtures in the active season."
						/>
					)}
				</div>
			</PanelCard>

			<PanelCard
				action={<DashboardLinkButton to="/matches">View results</DashboardLinkButton>}
				description={`${postponedMatchesCount} postponed matches in the active season.`}
				title="Recent results"
			>
				<div className="space-y-3">
					{latestThreeResults.map((match) => (
						<MatchListItem key={match.id} match={match} showResult />
					))}

					{latestThreeResults.length === 0 && (
						<EmptyState
							title="No recent results"
							message="No completed results in the active season."
						/>
					)}
				</div>
			</PanelCard>
		</div>
	);
}

function DashboardLinkButton({ children, to }: { children: string; to: string }) {
	return (
		<LinkButton
			to={to}
			className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:no-underline"
		>
			{children}
		</LinkButton>
	);
}
