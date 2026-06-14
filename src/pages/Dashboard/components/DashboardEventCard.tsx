import { Link } from "react-router-dom";

import type { ClubEvent, ClubEventAvailabilityStatus } from "../../../types/events";
import { getEventCounts, getPlayerAvailabilityStatus } from "../../../utils/events";

type DashboardEventCardProps = {
	event: ClubEvent;
	currentPlayerId?: string | null;
	onSetAvailability?: (eventId: string, status: ClubEventAvailabilityStatus) => Promise<void>;
};

export default function DashboardEventCard({
	currentPlayerId,
	event,
	onSetAvailability,
}: DashboardEventCardProps) {
	const canUpdateOwnAvailability = Boolean(currentPlayerId && onSetAvailability);
	const currentStatus = currentPlayerId
		? getPlayerAvailabilityStatus(event, currentPlayerId)
		: "Unanswered";

	const counts = getEventCounts(event);

	return (
		<div className="rounded-xl border border-slate-200 p-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<div className="flex flex-wrap gap-2">
						<Pill label={event.type} />
						<Pill label={getTeamScopeLabel(event.teamScope)} />
						{event.matchLinks?.some((matchLink) => matchLink.matchId) && (
							<Pill label="Linked match" />
						)}
					</div>

					<Link
						to={`/events/${event.id}`}
						className="mt-2 block font-bold text-slate-900 hover:text-blue-700"
					>
						{event.title}
					</Link>

					<p className="mt-1 text-sm text-slate-500">
						{formatDateTime(event.startDateTime)}
						{event.location ? ` · ${event.location}` : ""}
					</p>

					<p className="mt-2 text-xs font-semibold text-slate-500">
						Seen {counts.seen} · Available {counts.available} · Declined {counts.declined}
					</p>
				</div>

				{canUpdateOwnAvailability && (
					<div className="min-w-48 rounded-xl bg-slate-50 p-3">
						<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
							Your availability
						</p>

						<div className="mt-2 flex flex-wrap gap-2">
							<AvailabilityButton
								isSelected={currentStatus === "Available"}
								label="Available"
								onClick={() => void onSetAvailability?.(event.id, "Available")}
							/>
							<AvailabilityButton
								isSelected={currentStatus === "Declined"}
								label="Declined"
								onClick={() => void onSetAvailability?.(event.id, "Declined")}
							/>
							<AvailabilityButton
								isSelected={currentStatus === "Unanswered"}
								label="Unanswered"
								onClick={() => void onSetAvailability?.(event.id, "Unanswered")}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function Pill({ label }: { label: string }) {
	return (
		<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
			{label}
		</span>
	);
}

function AvailabilityButton({
	isSelected,
	label,
	onClick,
}: {
	isSelected: boolean;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
				isSelected
					? "bg-blue-700 text-white"
					: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
			}`}
		>
			{label}
		</button>
	);
}

function getTeamScopeLabel(teamScope: string) {
	if (teamScope === "First") {
		return "First Team";
	}

	if (teamScope === "Second") {
		return "Second Team";
	}

	return "Both Teams";
}

function formatDateTime(value: string) {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "Date TBC";
	}

	return date.toLocaleString("en-GB", {
		weekday: "short",
		day: "2-digit",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}
