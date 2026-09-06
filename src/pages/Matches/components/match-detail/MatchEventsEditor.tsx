import { useMemo, useState } from "react";
import type {
	MatchPlayerStat,
	MatchTimelineEvent,
	MatchTimelineEventType,
	SelectedPlayer,
} from "../../../../stores/match";
import { deriveMatchStatsFromEvents, sortMatchEvents } from "./matchEventsDraft";

type ComposerState = {
	id?: string;
	type: MatchTimelineEventType;
	minute: number;
	playerId: string;
	secondaryPlayerId: string;
};

interface MatchEventsEditorProps {
	selectedPlayers: SelectedPlayer[];
	playerStats: MatchPlayerStat[];
	matchEvents: MatchTimelineEvent[];
	matchDurationMinutes: number;
	getPlayerName: (playerId: string) => string;
	onSave: (
		matchDurationMinutes: number,
		matchEvents: MatchTimelineEvent[]
	) => Promise<void>;
}

const eventOptions: Array<{ value: MatchTimelineEventType; label: string }> = [
	{ value: "goal", label: "Goal" },
	{ value: "yellowCard", label: "Yellow card" },
	{ value: "redCard", label: "Red card" },
	{ value: "substitution", label: "Substitution" },
];

export function MatchEventsEditor({
	selectedPlayers,
	playerStats,
	matchEvents,
	matchDurationMinutes,
	getPlayerName,
	onSave,
}: MatchEventsEditorProps) {
	const [duration, setDuration] = useState(matchDurationMinutes || 90);
	const [draftEvents, setDraftEvents] = useState(() => sortMatchEvents(matchEvents));
	const [savedEvents, setSavedEvents] = useState(() => sortMatchEvents(matchEvents));
	const [composer, setComposer] = useState<ComposerState | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState("");
	const [source, setSource] = useState({ matchEvents, matchDurationMinutes });

	if (
		source.matchEvents !== matchEvents ||
		source.matchDurationMinutes !== matchDurationMinutes
	) {
		const nextEvents = sortMatchEvents(matchEvents);
		setSource({ matchEvents, matchDurationMinutes });
		setDuration(matchDurationMinutes || 90);
		setDraftEvents(nextEvents);
		setSavedEvents(nextEvents);
		setMessage("");
	}

	const starters = selectedPlayers.filter((player) => player.area === "pitch");
	const substitutes = selectedPlayers.filter((player) => player.area === "bench");
	const hasLegacyStats = matchEvents.length === 0 && playerStats.some((stat) =>
		stat.goals > 0 ||
		stat.assists > 0 ||
		stat.yellowCards > 0 ||
		stat.redCards > 0 ||
		stat.minutes > 0 ||
		stat.appearanceType === "substituteUsed"
	);
	const derivedStats = useMemo(
		() => hasLegacyStats && draftEvents.length === 0 && duration === matchDurationMinutes
			? playerStats
			: deriveMatchStatsFromEvents(selectedPlayers, draftEvents, duration, playerStats),
		[
			selectedPlayers,
			draftEvents,
			duration,
			playerStats,
			hasLegacyStats,
			matchDurationMinutes,
		]
	);
	const hasChanges =
		duration !== matchDurationMinutes ||
		JSON.stringify(draftEvents) !== JSON.stringify(savedEvents);
	const canSave = hasChanges || playerStats.length === 0;

	function suggestedMinute() {
		const latestMinute = draftEvents.reduce(
			(latest, matchEvent) => Math.max(latest, matchEvent.minute),
			0
		);
		return Math.min(latestMinute + (latestMinute > 0 ? 1 : 0), duration);
	}

	function openComposer(
		type: MatchTimelineEventType = "goal",
		selectedPlayer?: SelectedPlayer
	) {
		const defaultStarter = starters[0]?.playerId ?? selectedPlayers[0]?.playerId ?? "";
		const defaultSubstitute = substitutes[0]?.playerId ?? selectedPlayers[0]?.playerId ?? "";
		const isSelectedStarter = selectedPlayer?.area === "pitch";

		setComposer({
			type,
			minute: suggestedMinute(),
			playerId:
				type === "substitution"
					? isSelectedStarter
						? defaultSubstitute
						: selectedPlayer?.playerId ?? defaultSubstitute
					: selectedPlayer?.playerId ?? defaultStarter,
			secondaryPlayerId:
				type === "substitution"
					? isSelectedStarter
						? selectedPlayer?.playerId ?? defaultStarter
						: defaultStarter
					: "",
		});
	}

	function editEvent(matchEvent: MatchTimelineEvent) {
		setComposer({
			id: matchEvent.id,
			type: matchEvent.type,
			minute: matchEvent.minute,
			playerId: matchEvent.playerId,
			secondaryPlayerId: matchEvent.secondaryPlayerId ?? "",
		});
	}

	function saveComposer() {
		if (!composer) return;
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

		setDraftEvents((events) =>
			sortMatchEvents(
				composer.id
					? events.map((matchEvent) =>
						matchEvent.id === composer.id ? nextEvent : matchEvent
					)
					: [...events, nextEvent]
			)
		);
		setMessage("");
		setComposer(null);
	}

	async function saveTimeline() {
		setIsSaving(true);
		setMessage("");
		try {
			await onSave(duration, draftEvents);
			setSavedEvents(draftEvents);
			setMessage("Match events and player stats saved.");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Could not save match events.");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div className="mt-4 space-y-4">
			<div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-950 to-blue-800 p-4 text-white sm:p-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">Post-match report</p>
						<h3 className="mt-1 text-xl font-bold">Add events from the match</h3>
						<p className="mt-1 max-w-2xl text-sm leading-6 text-blue-100">
							Add goals, assists, cards and substitutions with the minute they happened. Players who start and are not substituted automatically receive the full match.
						</p>
					</div>
					<div className="flex shrink-0 items-end gap-2">
						<label>
							<span className="mb-1 block text-[0.65rem] font-bold uppercase tracking-wide text-blue-200">Match length</span>
							<span className="flex h-11 items-center rounded-xl bg-white px-3 text-slate-950">
								<input
									type="number"
									min="1"
									max="180"
									value={duration}
									onChange={(event) => {
										const value = Number(event.target.value);
										if (value > 0) setDuration(Math.min(Math.round(value), 180));
									}}
									className="w-12 bg-transparent text-center text-sm font-bold outline-none"
								/>
								<span className="text-xs font-semibold text-slate-500">min</span>
							</span>
						</label>
						<button type="button" onClick={() => openComposer()} className="h-11 rounded-xl bg-yellow-300 px-4 text-sm font-bold text-blue-950 hover:bg-yellow-200">
							+ Add event
						</button>
					</div>
				</div>
			</div>

			{hasLegacyStats && draftEvents.length === 0 && (
				<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
					<p className="font-bold">This match has an older manual stats report.</p>
					<p className="mt-1 text-xs leading-5 text-amber-800">
						Its totals are still shown below. Adding and saving timeline events will replace those calculated totals; player notes and MOTM selections are kept.
					</p>
				</div>
			)}

			<div className="grid gap-4 xl:grid-cols-2">
				<PlayerGroup
					title="Starting XI"
					players={starters}
					derivedStats={derivedStats}
					matchEvents={draftEvents}
					getPlayerName={getPlayerName}
					onAddEvent={openComposer}
				/>
				<PlayerGroup
					title="Substitutes"
					players={substitutes}
					derivedStats={derivedStats}
					matchEvents={draftEvents}
					getPlayerName={getPlayerName}
					onAddEvent={openComposer}
				/>
			</div>

			<div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h3 className="font-bold text-slate-950">Match timeline</h3>
						<p className="mt-0.5 text-xs text-slate-500">{draftEvents.length} recorded {draftEvents.length === 1 ? "event" : "events"}</p>
					</div>
					<button type="button" onClick={() => openComposer()} className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50">+ Add event</button>
				</div>

				{draftEvents.length === 0 ? (
					<div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
						No events recorded yet. Every starter is currently counted as playing {duration} minutes.
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
									onClick={() => {
										setDraftEvents((events) => events.filter((item) => item.id !== matchEvent.id));
										setMessage("");
									}}
									className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
								>
									Remove
								</button>
							</li>
						))}
					</ol>
				)}
			</div>

			<div className="sticky bottom-20 z-10 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:flex sm:items-center sm:justify-between lg:bottom-4">
				<div className="mb-2 sm:mb-0">
					<p className="text-sm font-bold text-slate-900">{hasChanges ? "Unsaved match events" : "Timeline up to date"}</p>
					{message && <p className={`mt-0.5 text-xs ${message.includes("saved") ? "text-emerald-700" : "text-red-700"}`}>{message}</p>}
				</div>
				<button type="button" disabled={isSaving || !canSave} onClick={() => void saveTimeline()} className="w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
					{isSaving ? "Saving..." : "Save match report"}
				</button>
			</div>

			{composer && (
				<EventComposer
					composer={composer}
					selectedPlayers={selectedPlayers}
					duration={duration}
					getPlayerName={getPlayerName}
					onChange={setComposer}
					onCancel={() => setComposer(null)}
					onSave={saveComposer}
				/>
			)}
		</div>
	);
}

function PlayerGroup({
	title,
	players,
	derivedStats,
	matchEvents,
	getPlayerName,
	onAddEvent,
}: {
	title: string;
	players: SelectedPlayer[];
	derivedStats: MatchPlayerStat[];
	matchEvents: MatchTimelineEvent[];
	getPlayerName: (playerId: string) => string;
	onAddEvent: (type: MatchTimelineEventType, player: SelectedPlayer) => void;
}) {
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
			<h3 className="font-bold text-slate-950">{title} <span className="text-slate-400">{players.length}</span></h3>
			<div className="mt-3 space-y-2">
				{players.length === 0 ? (
					<p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">No players selected.</p>
				) : players.map((player) => {
					const stat = derivedStats.find((item) => item.playerId === player.playerId);
					const eventCount = matchEvents.filter((matchEvent) =>
						matchEvent.playerId === player.playerId || matchEvent.secondaryPlayerId === player.playerId
					).length;
					return (
						<div key={player.playerId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="font-bold text-slate-950">{getPlayerName(player.playerId)}</p>
									<p className="mt-0.5 text-xs font-medium text-slate-500">
										{stat?.appearanceType === "unusedSubstitute" ? "Did not play" : `${stat?.minutes ?? 0} min`}
										{stat?.goals ? ` · ${stat.goals}G` : ""}
										{stat?.assists ? ` · ${stat.assists}A` : ""}
										{eventCount ? ` · ${eventCount} ${eventCount === 1 ? "event" : "events"}` : ""}
									</p>
								</div>
								<span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${stat?.appearanceType === "unusedSubstitute" ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}>
									{stat?.appearanceType === "unusedSubstitute" ? "Unused" : "Played"}
								</span>
							</div>
							<div className="mt-3 grid grid-cols-3 gap-2">
								<EventButton label="Goal" disabled={stat?.appearanceType === "unusedSubstitute"} onClick={() => onAddEvent("goal", player)} />
								<EventButton label="Card" disabled={stat?.appearanceType === "unusedSubstitute"} onClick={() => onAddEvent("yellowCard", player)} />
								<EventButton label="Sub" onClick={() => onAddEvent("substitution", player)} />
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}

function EventButton({ label, disabled = false, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
	return <button type="button" disabled={disabled} onClick={onClick} className="rounded-lg border border-blue-200 bg-white px-2 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300">+ {label}</button>;
}

function EventComposer({
	composer,
	selectedPlayers,
	duration,
	getPlayerName,
	onChange,
	onCancel,
	onSave,
}: {
	composer: ComposerState;
	selectedPlayers: SelectedPlayer[];
	duration: number;
	getPlayerName: (playerId: string) => string;
	onChange: (composer: ComposerState) => void;
	onCancel: () => void;
	onSave: () => void;
}) {
	const valid = Boolean(composer.playerId) && composer.minute >= 0 && composer.minute <= duration && (
		composer.type !== "substitution" || Boolean(composer.secondaryPlayerId)
	) && composer.playerId !== composer.secondaryPlayerId;
	const playerOptions = selectedPlayers.map((player) => (
		<option key={player.playerId} value={player.playerId}>{getPlayerName(player.playerId)}</option>
	));

	return (
		<div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={composer.id ? "Edit match event" : "Add match event"}>
			<div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-xs font-bold uppercase tracking-wide text-blue-700">Match timeline</p>
						<h3 className="mt-1 text-xl font-bold text-slate-950">{composer.id ? "Edit event" : "Add event"}</h3>
					</div>
					<button type="button" onClick={onCancel} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600">Close</button>
				</div>

				<div className="mt-5 grid grid-cols-2 gap-2">
					{eventOptions.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => onChange({ ...composer, type: option.value, secondaryPlayerId: option.value === "goal" || option.value === "substitution" ? composer.secondaryPlayerId : "" })}
							className={`rounded-xl px-3 py-2.5 text-sm font-bold ${composer.type === option.value ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
						>
							{option.label}
						</button>
					))}
				</div>

				<div className="mt-4 grid gap-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
					<label>
						<span className="mb-1.5 block text-xs font-bold text-slate-600">Minute</span>
						<input type="number" min="0" max={duration} value={composer.minute} onChange={(event) => onChange({ ...composer, minute: Number(event.target.value) })} className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
					</label>
					<label>
						<span className="mb-1.5 block text-xs font-bold text-slate-600">
							{composer.type === "substitution" ? "Player coming on" : composer.type === "goal" ? "Goalscorer" : "Player"}
						</span>
						<select value={composer.playerId} onChange={(event) => onChange({ ...composer, playerId: event.target.value })} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
							{playerOptions}
						</select>
					</label>
				</div>

				{composer.type === "goal" && (
					<label className="mt-4 block">
						<span className="mb-1.5 block text-xs font-bold text-slate-600">Assisted by <span className="font-medium text-slate-400">(optional)</span></span>
						<select value={composer.secondaryPlayerId} onChange={(event) => onChange({ ...composer, secondaryPlayerId: event.target.value })} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
							<option value="">No assist</option>
							{playerOptions}
						</select>
					</label>
				)}

				{composer.type === "substitution" && (
					<label className="mt-4 block">
						<span className="mb-1.5 block text-xs font-bold text-slate-600">Player going off</span>
						<select value={composer.secondaryPlayerId} onChange={(event) => onChange({ ...composer, secondaryPlayerId: event.target.value })} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
							<option value="">Choose player</option>
							{playerOptions}
						</select>
					</label>
				)}

				{composer.playerId === composer.secondaryPlayerId && composer.secondaryPlayerId && (
					<p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Choose two different players.</p>
				)}

				<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<button type="button" onClick={onCancel} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700">Cancel</button>
					<button type="button" disabled={!valid} onClick={onSave} className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40">{composer.id ? "Update event" : "Add to timeline"}</button>
				</div>
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
	if (matchEvent.type === "yellowCard" || matchEvent.type === "redCard") {
		return "Player card";
	}
	if (!matchEvent.secondaryPlayerId) return "No assist recorded";
	return matchEvent.type === "substitution"
		? `Off · ${getPlayerName(matchEvent.secondaryPlayerId)}`
		: `Assist · ${getPlayerName(matchEvent.secondaryPlayerId)}`;
}
