import EmptyState from "../../../components/compositions/EmptyState";
import PanelCard from "../../../components/compositions/PanelCard";
import type { ClubEvent, ClubEventAvailabilityStatus } from "../../../types/events";
import DashboardEventCard from "../components/DashboardEventCard";

export default function EventsTab({
	canManageEvents,
	currentPlayerId,
	onCreateEvent,
	onSetAvailability,
	recentEvents,
	upcomingEvents,
}: {
	canManageEvents: boolean;
	currentPlayerId?: string | null;
	onCreateEvent: () => void;
	onSetAvailability: (eventId: string, status: ClubEventAvailabilityStatus) => Promise<void>;
	recentEvents: ClubEvent[];
	upcomingEvents: ClubEvent[];
}) {
	return (
		<div className="space-y-3 lg:space-y-6">
			<PanelCard
				action={
					canManageEvents ? (
						<button
							type="button"
							onClick={onCreateEvent}
							className="rounded-xl bg-yepset-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-yepset-800"
						>
							Create event
						</button>
					) : undefined
				}
				description={
					canManageEvents
						? "Create training, social, meeting, and match events. Events are season agnostic."
						: "Update your availability for upcoming club events."
				}
				title="Upcoming events"
			>
				<div className="space-y-3">
					{upcomingEvents.map((event) => (
						<DashboardEventCard
							key={event.id}
							currentPlayerId={currentPlayerId}
							event={event}
							onSetAvailability={currentPlayerId ? onSetAvailability : undefined}
						/>
					))}

					{upcomingEvents.length === 0 && (
						<EmptyState
							title="No upcoming events"
							message="No upcoming events are available yet."
						/>
					)}
				</div>
			</PanelCard>

			<PanelCard
				description="Most recent past events."
				title="Recent events"
			>
				<div className="space-y-3">
					{recentEvents.map((event) => (
						<DashboardEventCard
							key={event.id}
							currentPlayerId={currentPlayerId}
							event={event}
							onSetAvailability={currentPlayerId ? onSetAvailability : undefined}
						/>
					))}

					{recentEvents.length === 0 && (
						<EmptyState
							title="No recent events"
							message="No recent events are available yet."
						/>
					)}
				</div>
			</PanelCard>
		</div>
	);
}
