import { useEffect, useMemo, useState, type FormEvent } from "react";

import LocationPicker from "../../../components/locations/LocationPicker";
import {
	FIRST_TEAM_ID,
	getClubTeamLabel,
	normaliseLegacyTeamId,
	type ClubTeamProfile,
	useClubTeamStore,
} from "../../../stores/clubTeams";
import { useMatchStore, type Match } from "../../../stores/match";
import { useSeasonStore } from "../../../stores/seasons";
import type {
	ClubEventType,
	CreateClubEventRequest,
	EventMatchVenue,
	RecurrenceIntervalUnit,
} from "../../../types/events";
import { formatDateForInput } from "../../../utils/date";
import {
	buildCreateMatchRequest,
	createMatchTeamDraft,
	getLegacyTeam,
	getLegacyTeamScope,
	summariseMatchLocations,
	type MatchTeamDraft,
} from "./eventMatchTeams";

type Props = {
	isOpen: boolean;
	onClose: () => void;
	onCreateEvent: (request: CreateClubEventRequest) => Promise<void>;
};

type MatchLinkMode = "none" | "link" | "create";
const eventTypes: ClubEventType[] = ["Match", "Training", "Social", "Meeting"];

export default function EventFormModal({ isOpen, onClose, onCreateEvent }: Props) {
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const matches = useMatchStore((state) => state.matches);
	const loadMatches = useMatchStore((state) => state.loadMatches);
	const isLoadingMatches = useMatchStore((state) => state.isLoadingMatches);
	const teamProfiles = useClubTeamStore((state) => state.profiles);
	const activeTeamProfiles = teamProfiles.filter((profile) => profile.isActive);

	const [type, setType] = useState<ClubEventType>("Training");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startDateTime, setStartDateTime] = useState("");
	const [endDateTime, setEndDateTime] = useState("");
	const [hasEditedEndDateTime, setHasEditedEndDateTime] = useState(false);
	const [location, setLocation] = useState("");
	const [isRecurring, setIsRecurring] = useState(false);
	const [recurrenceInterval, setRecurrenceInterval] = useState(1);
	const [recurrenceUnit, setRecurrenceUnit] = useState<RecurrenceIntervalUnit>("Weeks");
	const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
	const [matchMode, setMatchMode] = useState<MatchLinkMode>("none");
	const [matchTeams, setMatchTeams] = useState<MatchTeamDraft[]>([
		createMatchTeamDraft(FIRST_TEAM_ID),
	]);
	const [error, setError] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const recurrencePreview = useMemo(
		() => buildRecurrencePreview({
			startDateTime,
			endDate: recurrenceEndDate,
			interval: recurrenceInterval,
			unit: recurrenceUnit,
			isRecurring: isRecurring && type !== "Match",
		}),
		[isRecurring, recurrenceEndDate, recurrenceInterval, recurrenceUnit, startDateTime, type]
	);

	useEffect(() => {
		if (isOpen && type === "Match" && matchMode === "link") {
			void loadMatches(activeSeasonId || undefined);
		}
	}, [activeSeasonId, isOpen, loadMatches, matchMode, type]);

	if (!isOpen) return null;

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");

		if (type === "Match" && matchTeams.length === 0) {
			setError("Choose at least one team for this event.");
			return;
		}

		const eventTitle = getEventTitle(type, title, startDateTime, matchTeams, teamProfiles);
		if (!eventTitle.trim()) {
			setError("Enter an event title.");
			return;
		}
		if (!startDateTime) {
			setError("Choose a start date and time.");
			return;
		}
		if (endDateTime && new Date(endDateTime).getTime() < new Date(startDateTime).getTime()) {
			setError("End date cannot be before the start date.");
			return;
		}
		if (type === "Match" && matchMode === "none" && !location.trim()) {
			setError("Enter the match location.");
			return;
		}

		const shouldCreateRecurrence = isRecurring && type !== "Match";
		if (shouldCreateRecurrence) {
			if (!recurrenceEndDate) {
				setError("Choose when the recurring series should end.");
				return;
			}
			if (recurrenceInterval < 1) {
				setError("Recurring interval must be at least 1.");
				return;
			}
			if (recurrencePreview.length === 0) {
				setError("Recurring preview has no event dates.");
				return;
			}
			if (recurrencePreview.length > 80) {
				setError("Recurring events are limited to 80 occurrences.");
				return;
			}
		}

		if (type === "Match" && matchMode === "link") {
			const missing = matchTeams.find((draft) => !draft.matchId);
			if (missing) {
				setError(`Choose the existing ${getClubTeamLabel(teamProfiles, missing.teamId)} match to link.`);
				return;
			}
		}

		if (type === "Match" && matchMode === "create") {
			if (!activeSeasonId) {
				setError("Choose an active season before creating linked matches.");
				return;
			}
			const missingOpponent = matchTeams.find((draft) => !draft.opponent.trim());
			if (missingOpponent) {
				setError(`Enter the ${getClubTeamLabel(teamProfiles, missingOpponent.teamId)} opponent.`);
				return;
			}
			const missingCompetition = matchTeams.find((draft) => !draft.competition.trim());
			if (missingCompetition) {
				setError(`Enter the ${getClubTeamLabel(teamProfiles, missingCompetition.teamId)} competition.`);
				return;
			}
			const missingLocation = matchTeams.find((draft) => !draft.location.trim());
			if (missingLocation) {
				setError(`Enter the ${getClubTeamLabel(teamProfiles, missingLocation.teamId)} match location.`);
				return;
			}
		}

		const teamIds = type === "Match" ? matchTeams.map((draft) => draft.teamId) : [];
		const eventLocation = getEventLocation(type, matchMode, location, matchTeams, matches);
		const request: CreateClubEventRequest = {
			type,
			teamScope: type === "Match" ? getLegacyTeamScope(teamIds) : "Both",
			teamIds,
			title: eventTitle,
			description: description.trim(),
			startDateTime: new Date(startDateTime).toISOString(),
			endDateTime: endDateTime ? new Date(endDateTime).toISOString() : null,
			location: eventLocation,
			matchLinks: type === "Match" && matchMode === "link"
				? matchTeams.map((draft) => ({
					team: getLegacyTeam(draft.teamId),
					teamId: draft.teamId,
					matchId: draft.matchId,
				}))
				: [],
			createLinkedMatches: type === "Match" && matchMode === "create",
			createMatches: type === "Match" && matchMode === "create" && activeSeasonId
				? matchTeams.map((draft) => buildCreateMatchRequest({
					draft,
					eventStartDateTime: startDateTime,
					seasonId: activeSeasonId,
				}))
				: [],
			recurrence: shouldCreateRecurrence ? {
				isRecurring: true,
				interval: recurrenceInterval,
				unit: recurrenceUnit,
				endDate: new Date(`${recurrenceEndDate}T23:59:59`).toISOString(),
			} : null,
		};

		setIsSaving(true);
		try {
			await onCreateEvent(request);
			resetForm();
			onClose();
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Failed to create event.");
		} finally {
			setIsSaving(false);
		}
	}

	function resetForm() {
		setType("Training");
		setTitle("");
		setDescription("");
		setStartDateTime("");
		setEndDateTime("");
		setHasEditedEndDateTime(false);
		setLocation("");
		setIsRecurring(false);
		setRecurrenceInterval(1);
		setRecurrenceUnit("Weeks");
		setRecurrenceEndDate("");
		setMatchMode("none");
		setMatchTeams([createMatchTeamDraft(activeTeamProfiles[0]?.id ?? FIRST_TEAM_ID)]);
		setError("");
		setIsSaving(false);
	}

	function handleTypeChange(nextType: ClubEventType) {
		setType(nextType);
		setError("");
		if (nextType !== "Match") {
			setMatchMode("none");
			return;
		}
		setIsRecurring(false);
		setMatchMode("create");
		setTitle("");
		if (matchTeams.length === 0) {
			setMatchTeams([createMatchTeamDraft(activeTeamProfiles[0]?.id ?? FIRST_TEAM_ID)]);
		}
		if (startDateTime && !hasEditedEndDateTime) {
			setEndDateTime(addMinutesToDateTimeLocal(startDateTime, 90));
		}
	}

	function toggleMatchTeam(teamId: string) {
		setMatchTeams((current) => current.some((draft) => draft.teamId === teamId)
			? current.filter((draft) => draft.teamId !== teamId)
			: [...current, createMatchTeamDraft(teamId)]);
		setError("");
	}

	function updateMatchTeam(teamId: string, changes: Partial<MatchTeamDraft>) {
		setMatchTeams((current) => current.map((draft) =>
			draft.teamId === teamId ? { ...draft, ...changes } : draft));
	}

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 px-3 py-6 sm:px-6">
			<div className="mx-auto w-full max-w-5xl rounded-2xl bg-white shadow-xl">
				<header className="border-b border-slate-200 px-5 py-4 sm:px-6">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-sm font-semibold uppercase tracking-wide text-blue-700">New event</p>
							<h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">Create club event</h2>
							<p className="mt-1 text-sm text-slate-500">A matchday can include several teams, with a separate opponent and match record for each.</p>
						</div>
						<button type="button" onClick={() => { resetForm(); onClose(); }} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">Close</button>
					</div>
				</header>

				<form onSubmit={handleSubmit} className="space-y-4 px-5 py-4 sm:px-6">
					{error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

					<label className="block text-sm font-semibold text-slate-700">
						Event type
						<select value={type} onChange={(event) => handleTypeChange(event.target.value as ClubEventType)} className={inputClassName}>
							{eventTypes.map((eventType) => <option key={eventType} value={eventType}>{eventType}</option>)}
						</select>
					</label>

					{type === "Match" && <TeamSelector profiles={activeTeamProfiles} drafts={matchTeams} onToggle={toggleMatchTeam} />}

					{type === "Training" || type === "Match" ? (
						<div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
							<p className="text-xs font-bold uppercase tracking-wide text-blue-700">Title</p>
							<p className="mt-1 text-sm font-semibold text-blue-950">{getEventTitle(type, title, startDateTime, matchTeams, teamProfiles) || (type === "Match" ? "Matchday" : "Training")}</p>
							<p className="mt-1 text-xs text-blue-800">{type === "Match" ? "The title updates from the selected teams and opponents." : "Training titles are generated from the selected start date."}</p>
						</div>
					) : (
						<label className="block text-sm font-semibold text-slate-700">Title<input type="text" value={title} onChange={(event) => setTitle(event.target.value)} className={inputClassName} required /></label>
					)}

					<label className="block text-sm font-semibold text-slate-700">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} className={inputClassName} /></label>

					<div className="grid gap-4 md:grid-cols-2">
						<label className="block text-sm font-semibold text-slate-700">Start<input type="datetime-local" value={startDateTime} onChange={(event) => {
							setStartDateTime(event.target.value);
							if (type === "Match" && event.target.value && !hasEditedEndDateTime) setEndDateTime(addMinutesToDateTimeLocal(event.target.value, 90));
						}} className={inputClassName} required /></label>
						<label className="block text-sm font-semibold text-slate-700">End<input type="datetime-local" value={endDateTime} onChange={(event) => { setEndDateTime(event.target.value); setHasEditedEndDateTime(Boolean(event.target.value)); }} className={inputClassName} />{type === "Match" && <span className="mt-1 block text-xs text-slate-500">Defaults to 90 minutes after kick-off. You can still override it.</span>}</label>
					</div>

					{(type !== "Match" || matchMode === "none") && (
						<LocationPicker value={location} onChange={setLocation} required={type === "Match"} />
					)}

					{type !== "Match" && <RecurrenceFields isRecurring={isRecurring} onRecurringChange={setIsRecurring} interval={recurrenceInterval} onIntervalChange={setRecurrenceInterval} unit={recurrenceUnit} onUnitChange={setRecurrenceUnit} endDate={recurrenceEndDate} onEndDateChange={setRecurrenceEndDate} preview={recurrencePreview} />}

					{type === "Match" && (
						<section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<h3 className="text-sm font-bold text-slate-900">Match records</h3>
							<p className="mt-1 text-sm text-slate-500">Availability stays on this shared event; each selected team gets its own match record.</p>
							<div className="mt-4 grid gap-2 sm:grid-cols-3">
								<MatchModeButton selected={matchMode === "none"} label="Event only" onClick={() => setMatchMode("none")} />
								<MatchModeButton selected={matchMode === "link"} label="Link existing matches" onClick={() => setMatchMode("link")} />
								<MatchModeButton selected={matchMode === "create"} label="Create separate matches" onClick={() => setMatchMode("create")} />
							</div>
							{matchMode === "link" && (
								<div className="mt-4 grid gap-4 lg:grid-cols-2">
									{isLoadingMatches && <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 lg:col-span-2">Loading existing matches...</p>}
									{matchTeams.map((draft) => <ExistingMatchSelect key={draft.teamId} label={`${getClubTeamLabel(teamProfiles, draft.teamId)} existing match`} matches={getAvailableMatchesForTeam(matches, draft.teamId)} value={draft.matchId} onChange={(matchId) => updateMatchTeam(draft.teamId, { matchId })} />)}
									<p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 lg:col-span-2">Each linked match keeps its own home/away setting and location.</p>
								</div>
							)}
							{matchMode === "create" && (
								<div className="mt-4 space-y-4">
									<div className="rounded-xl border border-yepset-100 bg-yepset-50 px-4 py-3 text-sm text-yepset-900">The event date is shared. Set each team&apos;s opponent, home/away status, competition and location separately.</div>
									<div className="grid gap-4 lg:grid-cols-2">{matchTeams.map((draft) => <MatchDetailsFields key={draft.teamId} draft={draft} label={getClubTeamLabel(teamProfiles, draft.teamId)} onChange={(changes) => updateMatchTeam(draft.teamId, changes)} />)}</div>
								</div>
							)}
						</section>
					)}

					<div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
						<button type="button" onClick={() => { resetForm(); onClose(); }} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
						<button type="submit" disabled={isSaving} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? "Creating..." : "Create event"}</button>
					</div>
				</form>
			</div>
		</div>
	);
}

const inputClassName = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

function TeamSelector({ profiles, drafts, onToggle }: { profiles: ClubTeamProfile[]; drafts: MatchTeamDraft[]; onToggle: (teamId: string) => void }) {
	return (
		<section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
			<div className="flex flex-wrap items-start justify-between gap-2">
				<div><h3 className="text-sm font-bold text-slate-900">Teams playing</h3><p className="mt-1 text-sm text-slate-600">Select every team taking part in this matchday.</p></div>
				<span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">{drafts.length} {drafts.length === 1 ? "team" : "teams"} selected</span>
			</div>
			<div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{profiles.map((profile) => {
					const selected = drafts.some((draft) => draft.teamId === profile.id);
					return <label key={profile.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${selected ? "border-blue-600 bg-white text-blue-950 shadow-sm" : "border-slate-200 bg-white/70 text-slate-600 hover:border-blue-300"}`}><input type="checkbox" checked={selected} onChange={() => onToggle(profile.id)} className="h-4 w-4 rounded border-slate-300 text-blue-700" /><span className="text-sm font-bold">{profile.displayName}</span></label>;
				})}
			</div>
			{profiles.length === 0 && <p className="mt-3 text-sm font-semibold text-amber-700">Add an active club team before creating a match event.</p>}
		</section>
	);
}

function MatchModeButton({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
	return <button type="button" onClick={onClick} className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${selected ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}>{label}</button>;
}

function ExistingMatchSelect({ label, matches, onChange, value }: { label: string; matches: Match[]; onChange: (id: string) => void; value: string }) {
	return (
		<label className="block rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className={inputClassName}><option value="">Select a match...</option>{matches.map((match) => <option key={match.id} value={match.id}>{formatMatchOption(match)}</option>)}</select>{matches.length === 0 && <span className="mt-2 block text-xs font-medium text-slate-500">No unlinked matches found for this team in the loaded season.</span>}</label>
	);
}

function MatchDetailsFields({ draft, label, onChange }: { draft: MatchTeamDraft; label: string; onChange: (changes: Partial<MatchTeamDraft>) => void }) {
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-4">
			<h4 className="text-sm font-bold text-slate-900">{label}</h4>
			<div className="mt-4 space-y-4">
				<label className="block text-sm font-semibold text-slate-700">Opponent<input type="text" value={draft.opponent} onChange={(event) => onChange({ opponent: event.target.value })} placeholder="e.g. AFC Oak" className={inputClassName} /></label>
				<label className="block text-sm font-semibold text-slate-700">Home/Away<select value={draft.venue} onChange={(event) => onChange({ venue: event.target.value as EventMatchVenue })} className={inputClassName}><option value="Home">Home</option><option value="Away">Away</option></select></label>
				<label className="block text-sm font-semibold text-slate-700">Competition<input type="text" value={draft.competition} onChange={(event) => onChange({ competition: event.target.value })} className={inputClassName} /></label>
				<LocationPicker value={draft.location} onChange={(location) => onChange({ location })} label="Match location" required />
			</div>
		</section>
	);
}

function RecurrenceFields({ isRecurring, onRecurringChange, interval, onIntervalChange, unit, onUnitChange, endDate, onEndDateChange, preview }: { isRecurring: boolean; onRecurringChange: (value: boolean) => void; interval: number; onIntervalChange: (value: number) => void; unit: RecurrenceIntervalUnit; onUnitChange: (value: RecurrenceIntervalUnit) => void; endDate: string; onEndDateChange: (value: string) => void; preview: Date[] }) {
	return (
		<section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
			<label className="flex items-start gap-3"><input type="checkbox" checked={isRecurring} onChange={(event) => onRecurringChange(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" /><span><span className="block text-sm font-bold text-slate-900">Repeat this event</span><span className="mt-1 block text-sm text-slate-500">Create multiple events between the start date and an end date.</span></span></label>
			{isRecurring && <div className="mt-4 space-y-4">
				<div className="grid gap-4 md:grid-cols-3">
					<label className="block text-sm font-semibold text-slate-700">Every<input type="number" min="1" value={interval} onChange={(event) => onIntervalChange(Number(event.target.value))} className={inputClassName} /></label>
					<label className="block text-sm font-semibold text-slate-700">Unit<select value={unit} onChange={(event) => onUnitChange(event.target.value as RecurrenceIntervalUnit)} className={inputClassName}><option value="Days">Days</option><option value="Weeks">Weeks</option></select></label>
					<label className="block text-sm font-semibold text-slate-700">Until<input type="date" value={endDate} onChange={(event) => onEndDateChange(event.target.value)} className={inputClassName} /></label>
				</div>
				<div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Preview · {preview.length} {preview.length === 1 ? "event" : "events"}</p>{preview.length === 0 ? <p className="mt-2 text-sm text-slate-500">Choose a start date and end date to preview the series.</p> : <div className="mt-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto">{preview.map((date) => <span key={date.toISOString()} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">{formatPreviewDate(date)}</span>)}</div>}</div>
			</div>}
		</section>
	);
}

function getAvailableMatchesForTeam(matches: Match[], teamId: string) {
	return [...matches].filter((match) => normaliseLegacyTeamId(match.team) === teamId && !match.clubEventId).sort((first, second) => new Date(first.date).getTime() - new Date(second.date).getTime());
}

function getEventLocation(type: ClubEventType, mode: MatchLinkMode, fallback: string, drafts: MatchTeamDraft[], matches: Match[]) {
	if (type !== "Match" || mode === "none") return fallback.trim();

	if (mode === "create") {
		return summariseMatchLocations(drafts.map((draft) => draft.location));
	}

	return summariseMatchLocations(drafts.map((draft) =>
		matches.find((match) => match.id === draft.matchId)?.location ?? ""));
}

function formatMatchOption(match: Match) {
	return `${formatShortDate(match.date)} · ${match.opponent} · ${match.venue === "home" ? "Home" : "Away"}`;
}

function formatShortDate(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Date TBC";
	return date.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function getEventTitle(type: ClubEventType, title: string, start: string, drafts: MatchTeamDraft[], profiles: ClubTeamProfile[]) {
	if (type === "Match") {
		if (drafts.length === 1) {
			const draft = drafts[0];
			const team = getClubTeamLabel(profiles, draft.teamId);
			return draft.opponent.trim() ? `${team} vs ${draft.opponent.trim()}` : `${team} match`;
		}
		return drafts.length > 1 ? `Club matchday · ${drafts.length} teams` : "";
	}
	if (type !== "Training") return title.trim();
	return start ? `Training ${formatDateOnly(start)}` : "Training";
}

function addMinutesToDateTimeLocal(value: string, minutes: number) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	date.setMinutes(date.getMinutes() + minutes);
	return formatDateForInput(date.toISOString());
}

function formatDateOnly(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function buildRecurrencePreview({ startDateTime, endDate, interval, unit, isRecurring }: { startDateTime: string; endDate: string; interval: number; unit: RecurrenceIntervalUnit; isRecurring: boolean }) {
	if (!isRecurring || !startDateTime || !endDate || interval < 1) return [];
	const dates: Date[] = [];
	const current = new Date(startDateTime);
	const end = new Date(`${endDate}T23:59:59`);
	while (current.getTime() <= end.getTime() && dates.length <= 80) {
		dates.push(new Date(current));
		current.setDate(current.getDate() + (unit === "Weeks" ? interval * 7 : interval));
	}
	return dates;
}

function formatPreviewDate(date: Date) {
	return date.toLocaleString("en-GB", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
