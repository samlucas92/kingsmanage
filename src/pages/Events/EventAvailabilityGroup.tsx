import type { Player } from "../../stores/players";
import type {
	ClubEvent,
	ClubEventAvailabilityStatus,
} from "../../types/events";
import {
	getPlayerAvailabilityStatus,
	hasPlayerSeenEvent,
} from "../../utils/events";

interface EventAvailabilityGroupProps {
	event: ClubEvent;
	isManagementRole: boolean;
	label: string;
	onAvailabilityChange: (
		playerId: string,
		status: ClubEventAvailabilityStatus
	) => Promise<void>;
	players: Player[];
}

export function EventAvailabilityGroup({
	event,
	isManagementRole,
	label,
	onAvailabilityChange,
	players,
}: EventAvailabilityGroupProps) {
	return (
		<section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
			<div className="flex items-center justify-between gap-3">
				<h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">
					{label}
				</h3>
				<span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
					{players.length}
				</span>
			</div>

			<div className="mt-3 space-y-2">
				{players.map((player) => {
					const status = getPlayerAvailabilityStatus(event, player.id);
					const hasSeen = hasPlayerSeenEvent(event, player.id);

					return (
						<div
							key={player.id}
							className="rounded-xl border border-slate-200 bg-white px-4 py-3"
						>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<p className="truncate text-sm font-bold text-slate-900">
											{player.name}
										</p>
										{hasSeen && (
											<span className="text-xs font-semibold text-slate-400">
												Seen
											</span>
										)}
									</div>
									<p className="mt-0.5 text-xs text-slate-500">{status}</p>
								</div>

								{isManagementRole && (
									<div className="flex flex-wrap gap-2">
										<AvailabilityButton
											isSelected={status === "Available"}
											label="Available"
											onClick={() =>
												void onAvailabilityChange(player.id, "Available")
											}
										/>
										<AvailabilityButton
											isSelected={status === "Declined"}
											label="Declined"
											onClick={() =>
												void onAvailabilityChange(player.id, "Declined")
											}
										/>
										<AvailabilityButton
											isSelected={status === "Unanswered"}
											label="Unanswered"
											onClick={() =>
												void onAvailabilityChange(player.id, "Unanswered")
											}
										/>
									</div>
								)}
							</div>
						</div>
					);
				})}

				{players.length === 0 && (
					<p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
						No players in this group.
					</p>
				)}
			</div>
		</section>
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
			className={`rounded-xl px-3 py-2 text-xs font-bold ${
				isSelected
					? "bg-blue-700 text-white"
					: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
			}`}
		>
			{label}
		</button>
	);
}
