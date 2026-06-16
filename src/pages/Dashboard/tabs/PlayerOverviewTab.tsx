import { Link } from "react-router-dom";

import QuickActionCard from "../../../components/compositions/QuickActionCard";
import type { ClubEvent, ClubEventAvailabilityStatus } from "../../../types/events";
import type { ClubPost } from "../../../types/posts";
import { formatDisplayDateTime } from "../../../utils/date";
import { getPlayerAvailabilityStatus } from "../../../utils/events";
import { getPostTypeClass, getPostTypeLabel } from "../../../utils/posts";
import AttentionCard from "../components/AttentionCard";
import DashboardEventCard from "../components/DashboardEventCard";

export default function PlayerOverviewTab({
	currentPlayerId,
	latestPost,
	onSetAvailability,
	upcomingEvents,
}: {
	currentPlayerId?: string | null;
	latestPost?: ClubPost;
	onSetAvailability: (eventId: string, status: ClubEventAvailabilityStatus) => Promise<void>;
	upcomingEvents: ClubEvent[];
}) {
	const nextEvent = upcomingEvents[0];
	const responseNeededEvents = currentPlayerId
		? upcomingEvents.filter(
				(event) => getPlayerAvailabilityStatus(event, currentPlayerId) === "Unanswered"
			)
		: [];

	return (
		<div className="space-y-5">
			<div className="grid gap-5 lg:grid-cols-3">
				<AttentionCard
					title="Responses needed"
					tone={responseNeededEvents.length > 0 ? "danger" : "good"}
				>
					<p className="text-3xl font-black text-slate-900">
						{responseNeededEvents.length}
					</p>

					<p className="mt-2 text-sm text-slate-600">
						{responseNeededEvents.length > 0
							? "Events are waiting for your availability response."
							: "You are up to date with event responses."}
					</p>

					{responseNeededEvents.length > 0 && (
						<Link
							to="/dashboard?tab=events"
							className="mt-4 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
						>
							Go to events
						</Link>
					)}
				</AttentionCard>

				<AttentionCard title="Next event" tone={nextEvent ? "neutral" : "muted"}>
					{nextEvent ? (
						<div>
							<p className="text-lg font-bold text-slate-900">{nextEvent.title}</p>
							<p className="mt-2 text-sm font-semibold text-slate-700">
								{formatDisplayDateTime(nextEvent.startDateTime)}
							</p>
							{nextEvent.location && (
								<p className="mt-1 text-sm text-slate-500">{nextEvent.location}</p>
							)}
							<Link
								to={`/events/${nextEvent.id}`}
								className="mt-4 inline-flex rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
							>
								Open event
							</Link>
						</div>
					) : (
						<p className="text-sm text-slate-500">No upcoming events are available yet.</p>
					)}
				</AttentionCard>

				<AttentionCard title="Latest post" tone={latestPost ? "neutral" : "muted"}>
					{latestPost ? (
						<Link
							to={`/posts/${latestPost.id}`}
							className="block rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50"
						>
							<div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
								<span className={`rounded-full px-3 py-1 uppercase tracking-wide ${getPostTypeClass(latestPost.type)}`}>
									{getPostTypeLabel(latestPost.type)}
								</span>
								<span>{formatDisplayDateTime(latestPost.createdAt)}</span>
							</div>

							<p className="mt-3 font-bold text-slate-900">{latestPost.title}</p>
							<p
								className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600"
								style={{
									display: "-webkit-box",
									WebkitBoxOrient: "vertical",
									WebkitLineClamp: 3,
									overflow: "hidden",
								}}
							>
								{latestPost.body}
							</p>
						</Link>
					) : (
						<p className="text-sm text-slate-500">No posts have been published yet.</p>
					)}
				</AttentionCard>
			</div>

			{nextEvent && (
				<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
					<div className="mb-4">
						<h2 className="text-lg font-bold text-slate-900">Your next event</h2>
						<p className="text-sm text-slate-500">
							Update your availability quickly from here.
						</p>
					</div>

					<DashboardEventCard
						currentPlayerId={currentPlayerId}
						event={nextEvent}
						onSetAvailability={onSetAvailability}
					/>
				</section>
			)}

			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<h2 className="text-lg font-bold text-slate-900">Available now</h2>

				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					<QuickActionCard
						title="Events"
						description="View club events and update your availability."
						to="/dashboard?tab=events"
					/>

					<QuickActionCard
						title="Posts"
						description="Read the latest club updates and reminders."
						to="/dashboard?tab=posts"
					/>

					<QuickActionCard
						title="Account settings"
						description="Change your password and view your account details."
						to="/settings"
					/>
				</div>
			</section>
		</div>
	);
}
