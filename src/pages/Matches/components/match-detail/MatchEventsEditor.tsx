import { useState } from "react";
import type {
	MatchPlayerStat,
	MatchTimelineEvent,
	MatchTimelineEventType,
	SelectedPlayer,
} from "../../../../stores/match";
import type { ClubEventAvailabilityStatus } from "../../../../types/events";
import type { TrainingAvailabilitySummary } from "../../../../utils/trainingAvailability";
import type { SameDaySelection } from "../../sameDaySelections";
import TeamPicker from "../TeamPicker";
import { sortMatchEvents } from "./matchEventsDraft";

type PlayerArea = "pitch" | "bench";

type ComposerState = {
	id?: string;
	type: MatchTimelineEventType | null;
	minute: number;
	anchorPlayerId: string;
	anchorArea: PlayerArea;
	playerId: string;
	secondaryPlayerId: string;
};

interface MatchEventsEditorProps {
	matchId: string;
	selectedPlayers: SelectedPlayer[];
	playerStats: MatchPlayerStat[];
	matchEvents: MatchTimelineEvent[];
	matchDurationMinutes: number;
	getPlayerName: (playerId: string) => string;
	getPlayerAvailabilityStatus: (playerId: string) => ClubEventAvailabilityStatus | undefined;
	getPlayerTrainingAvailability: (playerId: string) => TrainingAvailabilitySummary;
	getPlayerSameDaySelections: (playerId: string) => SameDaySelection[];
	onSave: (
		matchDurationMinutes: number,
		matchEvents: MatchTimelineEvent[]
	) => Promise<void>;
}

const eventOptions: Array<{
	value: MatchTimelineEventType;
	label: string;
	description: string;
	icon: string;
}> = [
	{ value: "goal", label: "Goal", description: "Add the scorer and optional assist", icon: "⚽" },
	{ value: "yellowCard", label: "Yellow card", description: "Record a booking", icon: "🟨" },
	{ value: "redCard", label: "Red card", description: "Record a sending off", icon: "🟥" },
	{ value: "substitution", label: "Substitution", description: "Choose who came on or went off", icon: "↔" },
];

export function MatchEventsEditor({
	matchId,
	selectedPlayers,
	playerStats,
	matchEvents,
	matchDurationMinutes,
	getPlayerName,
	getPlayerAvailabilityStatus,
	getPlayerTrainingAvailability,
	getPlayerSameDaySelections,
	onSave,
}: MatchEventsEditorProps) {
	const duration = matchDurationMinutes || 90;
	const [draftEvents, setDraftEvents] = useState(() => sortMatchEvents(matchEvents));
	const [composer, setComposer] = useState<ComposerState | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState("");
	const [sourceEvents, setSourceEvents] = useState(matchEvents);

	if (sourceEvents !== matchEvents) {
		setSourceEvents(matchEvents);
		setDraftEvents(sortMatchEvents(matchEvents));
		setMessage("");
	}

	const starters = selectedPlayers.filter((player) => player.area === "pitch");
	const substitutes = selectedPlayers.filter((player) => player.area === "bench");
	const hasLegacyStats = matchEvents.length === 0 && playerStats.some((stat) =>
		stat.goals > 0 ||
		stat.assists > 0 ||
		stat.yellowCards > 0 ||
		stat.redCards > 0 ||
		stat.appearanceType === "substituteUsed"
	);

	function suggestedMinute() {
		const latestMinute = draftEvents.reduce(
			(latest, matchEvent) => Math.max(latest, matchEvent.minute),
			0
		);
		return Math.min(latestMinute + (latestMinute > 0 ? 1 : 0), duration);
	}

	function openComposer(playerId: string, area: PlayerArea) {
		setMessage("");
		setComposer({
			type: null,
			minute: suggestedMinute(),
			anchorPlayerId: playerId,
			anchorArea: area,
			playerId,
			secondaryPlayerId: "",
		});
	}

	function chooseEvent(type: MatchTimelineEventType) {
		if (!composer) return;

		if (type !== "substitution") {
			setComposer({
				...composer,
				type,
				playerId: composer.anchorPlayerId,
				secondaryPlayerId: "",
			});
			return;
		}

		const defaultStarter = starters.find(
			(player) => player.playerId !== composer.anchorPlayerId
		)?.playerId ?? "";
		const defaultSubstitute = substitutes.find(
			(player) => player.playerId !== composer.anchorPlayerId
		)?.playerId ?? "";

		setComposer({
			...composer,
			type,
			playerId: composer.anchorArea === "bench" ? composer.anchorPlayerId : defaultSubstitute,
			secondaryPlayerId: composer.anchorArea === "pitch" ? composer.anchorPlayerId : defaultStarter,
		});
	}

	function editEvent(matchEvent: MatchTimelineEvent) {
		const anchor = selectedPlayers.find((player) => player.playerId === matchEvent.playerId);
		setMessage("");
		setComposer({
			id: matchEvent.id,
			type: matchEvent.type,
			minute: matchEvent.minute,
			anchorPlayerId: matchEvent.playerId,
			anchorArea: anchor?.area ?? "pitch",
			playerId: matchEvent.playerId,
			secondaryPlayerId: matchEvent.secondaryPlayerId ?? "",
		});
	}

	async function persistEvents(nextEvents: MatchTimelineEvent[], successMessage: string) {
		setIsSaving(true);
		setMessage("");
		try {
			await onSave(duration, nextEvents);
			setDraftEvents(nextEvents);
			setMessage(successMessage);
			return true;
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Could not save the match event.");
			return false;
		} finally {
			setIsSaving(false);
		}
	}

	async function submitComposer() {
		if (!composer?.type) return;

		const nextEvent: MatchTimelineEvent = {
			id: composer.id ?? crypto.randomUUID(),
			type: composer.type,
			minute: Math.min(Math.max(Math.round(composer.minute), 0), duration),
			playerId: composer.playerId,
			secondaryPlayerId:
				composer.type === "goal" || composer.type === "substitution"
					? composer.secondaryPlayerId || null
					: null,
		};
		const nextEvents = sortMatchEvents(
			composer.id
				? draftEvents.map((matchEvent) => matchEvent.id === composer.id ? nextEvent : matchEvent)
				: [...draftEvents, nextEvent]
		);
		const saved = await persistEvents(
			nextEvents,
			composer.id ? "Match event updated." : "Match event added."
		);
		if (saved) setComposer(null);
	}

	async function removeEvent(eventId: string) {
		const nextEvents = draftEvents.filter((item) => item.id !== eventId);
		await persistEvents(nextEvents, "Match event removed.");
	}

	return (
		<div className="mt-4 space-y-4">
			<div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-950">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="text-sm font-bold">Add match events from the team sheet</p>
						<p className="mt-0.5 text-xs leading-5 text-blue-800">
							Select a player on the pitch or bench, then choose the event that happened. Starters who are not substituted are credited with all {duration} minutes.
						</p>
					</div>
					<span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-blue-900 shadow-sm">
						{duration}-minute match
					</span>
				</div>
			</div>

			{hasLegacyStats && (
				<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
					<p className="font-bold">This match has an older manual stats report.</p>
					<p className="mt-1 text-xs leading-5 text-amber-800">
						Adding an event will replace the old calculated totals. Player notes and man-of-the-match selections are kept.
					</p>
				</div>
			)}

			<div className="min-w-0 rounded-xl border border-dashed border-yepset-200 bg-yepset-50 p-2 text-slate-500 sm:p-4">
				<TeamPicker
					matchId={matchId}
					eventMode
					onSelectedPlayerClick={openComposer}
					getPlayerAvailabilityStatus={getPlayerAvailabilityStatus}
					getPlayerTrainingAvailability={getPlayerTrainingAvailability}
					getPlayerSameDaySelections={getPlayerSameDaySelections}
				/>
			</div>

			<section className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h3 className="font-bold text-slate-950">Match timeline</h3>
						<p className="mt-0.5 text-xs text-slate-500">
							{draftEvents.length} recorded {draftEvents.length === 1 ? "event" : "events"}
						</p>
					</div>
					{isSaving && <span className="text-xs font-bold text-blue-700">Saving…</span>}
				</div>

				{draftEvents.length === 0 ? (
					<div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
						No events recorded yet. Select a player above to add one.
					</div>
				) : (
					<ol className="mt-3 space-y-2">
						{draftEvents.map((matchEvent) => (
							<li key={matchEvent.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
								<span className="w-10 shrink-0 text-center text-sm font-black text-blue-900">{matchEvent.minute}′</span>
								<span className="text-xl" aria-hidden="true">{getEventIcon(matchEvent.type)}</span>
								<button type="button" onClick={() => editEvent(matchEvent)} className="min-w-0 flex-1 text-left">
									<span className="block text-sm font-bold text-slate-900">{getEventTitle(matchEvent, getPlayerName)}</span>
									<span className="block text-xs text-slate-500">{getEventSubtitle(matchEvent, getPlayerName)}</span>
								</button>
								<button
									type="button"
									disabled={isSaving}
									onClick={() => void removeEvent(matchEvent.id)}
									className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
								>
									Remove
								</button>
							</li>
						))}
					</ol>
				)}

				{message && !composer && (
					<p className={`mt-3 text-xs font-semibold ${message.includes("Could not") ? "text-red-700" : "text-emerald-700"}`}>
						{message}
					</p>
				)}
			</section>

			{composer && (
				<EventComposer
					composer={composer}
					selectedPlayers={selectedPlayers}
					duration={duration}
					isSaving={isSaving}
					message={message}
					getPlayerName={getPlayerName}
					onChooseEvent={chooseEvent}
					onChange={setComposer}
					onCancel={() => setComposer(null)}
					onSubmit={() => void submitComposer()}
				/>
			)}
		</div>
	);
}

function EventComposer({
	composer,
	selectedPlayers,
	duration,
	isSaving,
	message,
	getPlayerName,
	onChooseEvent,
	onChange,
	onCancel,
	onSubmit,
}: {
	composer: ComposerState;
	selectedPlayers: SelectedPlayer[];
	duration: number;
	isSaving: boolean;
	message: string;
	getPlayerName: (playerId: string) => string;
	onChooseEvent: (type: MatchTimelineEventType) => void;
	onChange: (composer: ComposerState) => void;
	onCancel: () => void;
	onSubmit: () => void;
}) {
	const valid = Boolean(composer.type) &&
		Boolean(composer.playerId) &&
		composer.minute >= 0 &&
		composer.minute <= duration &&
		(composer.type !== "substitution" || Boolean(composer.secondaryPlayerId)) &&
		composer.playerId !== composer.secondaryPlayerId;
	const playerOptions = selectedPlayers.map((player) => (
		<option key={player.playerId} value={player.playerId}>{getPlayerName(player.playerId)}</option>
	));
	const substitutionOptions = selectedPlayers
		.filter((player) =>
			composer.anchorArea === "pitch"
				? player.area === "bench"
				: player.area === "pitch"
		)
		.map((player) => (
			<option key={player.playerId} value={player.playerId}>{getPlayerName(player.playerId)}</option>
		));

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-4"
			role="dialog"
			aria-modal="true"
			aria-label={composer.id ? "Edit match event" : "Select an event"}
		>
			<div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-xs font-bold uppercase tracking-wide text-blue-700">{getPlayerName(composer.anchorPlayerId)}</p>
						<h3 className="mt-1 text-xl font-bold text-slate-950">{composer.id ? "Edit event" : "Select an event"}</h3>
						{!composer.id && <p className="mt-1 text-sm text-slate-500">What happened involving this player?</p>}
					</div>
					<button type="button" onClick={onCancel} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600">Close</button>
				</div>

				<div className="mt-5 grid grid-cols-2 gap-2">
					{eventOptions.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => onChooseEvent(option.value)}
							className={`rounded-xl border p-3 text-left transition ${composer.type === option.value ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}
						>
							<span className="flex items-center gap-2 text-sm font-bold"><span aria-hidden="true">{option.icon}</span>{option.label}</span>
							<span className={`mt-1 block text-[0.68rem] leading-4 ${composer.type === option.value ? "text-blue-100" : "text-slate-500"}`}>{option.description}</span>
						</button>
					))}
				</div>

				{composer.type && (
					<div className="mt-5 border-t border-slate-200 pt-5">
						<div className="grid gap-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
							<label>
								<span className="mb-1.5 block text-xs font-bold text-slate-600">Minute</span>
								<input
									type="number"
									min="0"
									max={duration}
									value={composer.minute}
									onChange={(event) => onChange({ ...composer, minute: Number(event.target.value) })}
									className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
								/>
							</label>

							{composer.type === "substitution" ? (
								<label>
									<span className="mb-1.5 block text-xs font-bold text-slate-600">{composer.anchorArea === "pitch" ? "Player coming on" : "Player going off"}</span>
									<select
										value={composer.anchorArea === "pitch" ? composer.playerId : composer.secondaryPlayerId}
										onChange={(event) => onChange(composer.anchorArea === "pitch" ? { ...composer, playerId: event.target.value } : { ...composer, secondaryPlayerId: event.target.value })}
										className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
									>
										<option value="">Choose player</option>
										{substitutionOptions}
									</select>
								</label>
							) : (
								<div>
									<span className="mb-1.5 block text-xs font-bold text-slate-600">{composer.type === "goal" ? "Goalscorer" : "Player"}</span>
									<div className="flex h-11 items-center rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-900">{getPlayerName(composer.playerId)}</div>
								</div>
							)}
						</div>

						{composer.type === "goal" && (
							<label className="mt-4 block">
								<span className="mb-1.5 block text-xs font-bold text-slate-600">Assisted by <span className="font-medium text-slate-400">(optional)</span></span>
								<select
									value={composer.secondaryPlayerId}
									onChange={(event) => onChange({ ...composer, secondaryPlayerId: event.target.value })}
									className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
								>
									<option value="">No assist</option>
									{playerOptions}
								</select>
							</label>
						)}

						{composer.type === "substitution" && (
							<div className="mt-4 rounded-xl bg-slate-100 px-3 py-3">
								<p className="text-xs font-bold text-slate-500">{composer.anchorArea === "pitch" ? "Player going off" : "Player coming on"}</p>
								<p className="mt-1 text-sm font-bold text-slate-900">{getPlayerName(composer.anchorPlayerId)}</p>
							</div>
						)}

						{composer.playerId === composer.secondaryPlayerId && composer.secondaryPlayerId && (
							<p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Choose two different players.</p>
						)}
						{message && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{message}</p>}

						<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<button type="button" onClick={onCancel} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700">Cancel</button>
							<button
								type="button"
								disabled={!valid || isSaving}
								onClick={onSubmit}
								className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
							>
								{isSaving ? "Saving…" : composer.id ? "Update event" : "Submit event"}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function getEventIcon(type: MatchTimelineEventType) {
	return type === "goal" ? "⚽" : type === "yellowCard" ? "🟨" : type === "redCard" ? "🟥" : "↔";
}

function getEventTitle(matchEvent: MatchTimelineEvent, getPlayerName: (playerId: string) => string) {
	return matchEvent.type === "goal"
		? `Goal · ${getPlayerName(matchEvent.playerId)}`
		: matchEvent.type === "yellowCard"
			? `Yellow card · ${getPlayerName(matchEvent.playerId)}`
			: matchEvent.type === "redCard"
				? `Red card · ${getPlayerName(matchEvent.playerId)}`
				: `On · ${getPlayerName(matchEvent.playerId)}`;
}

function getEventSubtitle(matchEvent: MatchTimelineEvent, getPlayerName: (playerId: string) => string) {
	if (matchEvent.type === "yellowCard" || matchEvent.type === "redCard") return "Player card";
	if (!matchEvent.secondaryPlayerId) return "No assist recorded";
	return matchEvent.type === "substitution"
		? `Off · ${getPlayerName(matchEvent.secondaryPlayerId)}`
		: `Assist · ${getPlayerName(matchEvent.secondaryPlayerId)}`;
}
