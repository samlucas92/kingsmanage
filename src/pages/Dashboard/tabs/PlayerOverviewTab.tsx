import EmptyState from "../../../components/compositions/EmptyState";
import QuickActionCard from "../../../components/compositions/QuickActionCard";
import type { ClubEvent, ClubEventAvailabilityStatus } from "../../../types/events";
import DashboardEventCard from "../components/DashboardEventCard";

export default function PlayerOverviewTab({
	currentPlayerId,
	onSetAvailability,
	upcomingEvents,
}: {
	currentPlayerId?: string | null;
	onSetAvailability: (eventId: string, status: ClubEventAvailabilityStatus) => Promise<void>;
	upcomingEvents: ClubEvent[];
}) {
	return (
		<div className="grid gap-5 lg:grid-cols-3">
			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
				<p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
					Player dashboard
				</p>

				<h2 className="mt-2 text-2xl font-bold text-slate-900">
					Your club events
				</h2>

				<p className="mt-2 text-sm text-slate-600">
					Update your availability for matches, training, and socials.
				</p>

				<div className="mt-5 space-y-3">
					{upcomingEvents.map((event) => (
						<DashboardEventCard
							key={event.id}
							currentPlayerId={currentPlayerId}
							event={event}
							onSetAvailability={onSetAvailability}
						/>
					))}

					{upcomingEvents.length === 0 && (
						<EmptyState
							title="No upcoming events"
							message="No upcoming events are available yet."
						/>
					)}
				</div>
			</section>

			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<h2 className="text-lg font-bold text-slate-900">Available now</h2>

				<div className="mt-4 space-y-3">
					<QuickActionCard
						title="Account settings"
						description="Change your password and view your account details."
						to="/settings"
					/>

					<div className="rounded-xl border border-dashed border-slate-300 p-4">
						<p className="text-sm font-bold text-slate-900">Coming later</p>
						<p className="mt-1 text-sm text-slate-500">
							My stats, my finance, and posts will be added after their safe player APIs exist.
						</p>
					</div>
				</div>
			</section>
		</div>
	);
}
