import { useEffect, useMemo, useState, type FormEvent } from "react";

import { useMatchStore, type ClubTeam, type Match } from "../../../stores/match";
import { useSeasonStore } from "../../../stores/seasons";
import {
	FIRST_TEAM_ID,
	SECOND_TEAM_ID,
	getClubTeamLabel,
	useClubTeamStore,
} from "../../../stores/clubTeams";
import type {
	ClubEventTeamScope,
	ClubEventType,
	CreateClubEventRequest,
	EventClubTeam,
	EventMatchVenue,
} from "../../../types/events";


type EventFormModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onCreateEvent: (request: CreateClubEventRequest) => Promise<void>;
};

type MatchLinkMode = "none" | "link" | "create";

type MatchDetails = {
	opponent: string;
	competition: string;
	location: string;
	venue: EventMatchVenue;
};

const eventTypes: ClubEventType[] = ["Match", "Training", "Social", "Meeting"];

const emptyMatchDetails: MatchDetails = {
	opponent: "",
	competition: "",
	location: "",
	venue: "Home",
};

export default function EventFormModal({
	isOpen,
	onClose,
	onCreateEvent,
}: EventFormModalProps) {
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const matches = useMatchStore((state) => state.matches);
	const loadMatches = useMatchStore((state) => state.loadMatches);
	const isLoadingMatches = useMatchStore((state) => state.isLoadingMatches);
	const teamProfiles = useClubTeamStore((state) => state.profiles);
	const activeTeamProfiles = teamProfiles.filter((profile) =>
		profile.isActive && (profile.id === FIRST_TEAM_ID || profile.id === SECOND_TEAM_ID)
	);
	const firstTeamLabel = getClubTeamLabel(teamProfiles, FIRST_TEAM_ID);
	const secondTeamLabel = getClubTeamLabel(teamProfiles, SECOND_TEAM_ID);

	const [type, setType] = useState<ClubEventType>("Training");
	const [teamScope, setTeamScope] = useState<ClubEventTeamScope>("First");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startDateTime, setStartDateTime] = useState("");
	const [endDateTime, setEndDateTime] = useState("");
	const [location, setLocation] = useState("");
	const [matchMode, setMatchMode] = useState<MatchLinkMode>("none");
	const [firstMatchId, setFirstMatchId] = useState("");
	const [secondMatchId, setSecondMatchId] = useState("");
	const [firstMatchDetails, setFirstMatchDetails] = useState<MatchDetails>(emptyMatchDetails);
	const [secondMatchDetails, setSecondMatchDetails] = useState<MatchDetails>(emptyMatchDetails);
	const [error, setError] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const teamsInScope = useMemo(
		() => (type === "Match" ? getTeamsForScope(teamScope) : []),
		[teamScope, type]
	);

	const firstTeamMatches = useMemo(
		() => getAvailableMatchesForTeam(matches, FIRST_TEAM_ID),
		[matches]
	);

	const secondTeamMatches = useMemo(
		() => getAvailableMatchesForTeam(matches, SECOND_TEAM_ID),
		[matches]
	);

	useEffect(() => {
		if (!isOpen || type !== "Match" || matchMode !== "link") {
			return;
		}

		void loadMatches(activeSeasonId || undefined);
	}, [activeSeasonId, isOpen, loadMatches, matchMode, type]);

	useEffect(() => {
		if (!isOpen || type !== "Match" || activeTeamProfiles.length === 0) return;
		const currentTeams = getTeamsForScope(teamScope);
		const activeTeams = activeTeamProfiles.map((profile) => profile.id === FIRST_TEAM_ID ? "First" : "Second");
		if (currentTeams.every((team) => activeTeams.includes(team))) return;
		setTeamScope(activeTeams[0]);
	}, [activeTeamProfiles, isOpen, teamScope, type]);

	if (!isOpen) {
		return null;
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		setError("");

		if (!title.trim()) {
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

		const matchLinks = [];
		const createMatches = [];

		if (type === "Match" && matchMode === "link") {
			if (teamsInScope.includes("First") && !firstMatchId) {
				setError(`Choose the existing ${firstTeamLabel} match to link.`);
				return;
			}

			if (teamsInScope.includes("Second") && !secondMatchId) {
				setError(`Choose the existing ${secondTeamLabel} match to link.`);
				return;
			}

			if (teamsInScope.includes("First")) {
				matchLinks.push({
					team: "First" as const,
					matchId: firstMatchId,
				});
			}

			if (teamsInScope.includes("Second")) {
				matchLinks.push({
					team: "Second" as const,
					matchId: secondMatchId,
				});
			}
		}

		if (type === "Match" && matchMode === "create") {
			if (!activeSeasonId) {
				setError("Choose an active season before creating linked matches.");
				return;
			}

			if (teamsInScope.includes("First") && !firstMatchDetails.opponent.trim()) {
				setError(`Enter the ${firstTeamLabel} opponent.`);
				return;
			}

			if (teamsInScope.includes("Second") && !secondMatchDetails.opponent.trim()) {
				setError(`Enter the ${secondTeamLabel} opponent.`);
				return;
			}

			if (teamsInScope.includes("First")) {
				createMatches.push(buildCreateMatchRequest({
					seasonId: activeSeasonId,
					team: "First",
					details: firstMatchDetails,
					eventStartDateTime: startDateTime,
					eventLocation: location,
				}));
			}

			if (teamsInScope.includes("Second")) {
				createMatches.push(buildCreateMatchRequest({
					seasonId: activeSeasonId,
					team: "Second",
					details: secondMatchDetails,
					eventStartDateTime: startDateTime,
					eventLocation: location,
				}));
			}
		}

		const request: CreateClubEventRequest = {
			type,
			teamScope: type === "Match" ? teamScope : "Both",
			title: title.trim(),
			description: description.trim(),
			startDateTime: new Date(startDateTime).toISOString(),
			endDateTime: endDateTime ? new Date(endDateTime).toISOString() : null,
			location: location.trim(),
			matchLinks,
			createLinkedMatches: type === "Match" && matchMode === "create",
			createMatches,
		};

		setIsSaving(true);

		try {
			await onCreateEvent(request);
			resetForm();
			onClose();
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to create event.");
		} finally {
			setIsSaving(false);
		}
	}

	function handleClose() {
		resetForm();
		onClose();
	}

	function resetForm() {
		setType("Training");
		setTeamScope("First");
		setTitle("");
		setDescription("");
		setStartDateTime("");
		setEndDateTime("");
		setLocation("");
		setMatchMode("none");
		setFirstMatchId("");
		setSecondMatchId("");
		setFirstMatchDetails(emptyMatchDetails);
		setSecondMatchDetails(emptyMatchDetails);
		setError("");
		setIsSaving(false);
	}

	function handleTypeChange(nextType: ClubEventType) {
		setType(nextType);
		setError("");

		if (nextType !== "Match") {
			setTeamScope("First");
			setMatchMode("none");
			setFirstMatchId("");
			setSecondMatchId("");
		}
	}

	function handleTeamScopeChange(nextTeamScope: ClubEventTeamScope) {
		setTeamScope(nextTeamScope);
		setFirstMatchId("");
		setSecondMatchId("");
	}

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 px-3 py-6 sm:px-6">
			<div className="mx-auto w-full max-w-4xl rounded-2xl bg-white shadow-xl">
				<div className="border-b border-slate-200 px-5 py-4 sm:px-6">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
								New event
							</p>
							<h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
								Create club event
							</h2>
							<p className="mt-1 text-sm text-slate-500">
								Create normal club events, or create/link match records when the event type is Match.
							</p>
						</div>

						<button
							type="button"
							onClick={handleClose}
							className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
						>
							Close
						</button>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4 px-5 py-4 sm:px-6">
					{error && (
						<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
							{error}
						</div>
					)}

					<div className={`grid gap-4 ${type === "Match" ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
						<label className="block text-sm font-semibold text-slate-700">
							Event type
							<select
								value={type}
								onChange={(event) => handleTypeChange(event.target.value as ClubEventType)}
								className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
							>
								{eventTypes.map((eventType) => (
									<option key={eventType} value={eventType}>
										{eventType}
									</option>
								))}
							</select>
						</label>

						{type === "Match" && (
							<label className="block text-sm font-semibold text-slate-700">
								Team
								<select
									value={teamScope}
									onChange={(event) => handleTeamScopeChange(event.target.value as ClubEventTeamScope)}
									className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
								>
									{activeTeamProfiles.map((profile) => (
										<option key={profile.id} value={profile.id === FIRST_TEAM_ID ? "First" : "Second"}>{profile.displayName}</option>
									))}
									{activeTeamProfiles.length > 1 && <option value="Both">Both Teams</option>}
								</select>
							</label>
						)}
					</div>

					<label className="block text-sm font-semibold text-slate-700">
						Title
						<input
							type="text"
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
							required
						/>
					</label>

					<label className="block text-sm font-semibold text-slate-700">
						Description
						<textarea
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							rows={2}
							className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
						/>
					</label>

					<div className="grid gap-4 md:grid-cols-2">
						<label className="block text-sm font-semibold text-slate-700">
							Start
							<input
								type="datetime-local"
								value={startDateTime}
								onChange={(event) => setStartDateTime(event.target.value)}
								className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
								required
							/>
						</label>

						<label className="block text-sm font-semibold text-slate-700">
							End
							<input
								type="datetime-local"
								value={endDateTime}
								onChange={(event) => setEndDateTime(event.target.value)}
								className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
							/>
						</label>
					</div>

					<label className="block text-sm font-semibold text-slate-700">
						Location
						<input
							type="text"
							value={location}
							onChange={(event) => setLocation(event.target.value)}
							className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
						/>
					</label>

					{type === "Match" && (
						<section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<h3 className="text-sm font-bold text-slate-900">Match record</h3>
							<p className="mt-1 text-sm text-slate-500">
								Choose whether this is just an event, links to existing matches, or creates new linked matches.
							</p>

							<div className="mt-4 grid gap-2 sm:grid-cols-3">
								<MatchModeButton
									isSelected={matchMode === "none"}
									label="Event only"
									onClick={() => setMatchMode("none")}
								/>
								<MatchModeButton
									isSelected={matchMode === "link"}
									label="Link existing match"
									onClick={() => setMatchMode("link")}
								/>
								<MatchModeButton
									isSelected={matchMode === "create"}
									label="Create new match"
									onClick={() => setMatchMode("create")}
								/>
							</div>

							{matchMode === "link" && (
								<div className="mt-4 space-y-4">
									{isLoadingMatches && (
										<p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500">
											Loading existing matches...
										</p>
									)}

									{teamsInScope.includes("First") && (
										<ExistingMatchSelect
											label={`${firstTeamLabel} existing match`}
											matches={firstTeamMatches}
											value={firstMatchId}
											onChange={setFirstMatchId}
										/>
									)}

									{teamsInScope.includes("Second") && (
										<ExistingMatchSelect
											label={`${secondTeamLabel} existing match`}
											matches={secondTeamMatches}
											value={secondMatchId}
											onChange={setSecondMatchId}
										/>
									)}
								</div>
							)}

							{matchMode === "create" && (
								<div className="mt-4 grid gap-4 lg:grid-cols-2">
									{teamsInScope.includes("First") && (
										<MatchDetailsFields
											details={firstMatchDetails}
											label={`${firstTeamLabel} match details`}
											onChange={setFirstMatchDetails}
										/>
									)}

									{teamsInScope.includes("Second") && (
										<MatchDetailsFields
											details={secondMatchDetails}
											label={`${secondTeamLabel} match details`}
											onChange={setSecondMatchDetails}
										/>
									)}
								</div>
							)}
						</section>
					)}

					<div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={handleClose}
							className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
						>
							Cancel
						</button>

						<button
							type="submit"
							disabled={isSaving}
							className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isSaving ? "Creating..." : "Create event"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function MatchModeButton({
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
			className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
				isSelected
					? "border-blue-700 bg-blue-700 text-white"
					: "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
			}`}
		>
			{label}
		</button>
	);
}

function ExistingMatchSelect({
	label,
	matches,
	onChange,
	value,
}: {
	label: string;
	matches: Match[];
	onChange: (matchId: string) => void;
	value: string;
}) {
	return (
		<label className="block text-sm font-semibold text-slate-700">
			{label}
			<select
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
			>
				<option value="">Select a match...</option>
				{matches.map((match) => (
					<option key={match.id} value={match.id}>
						{formatMatchOption(match)}
					</option>
				))}
			</select>
			{matches.length === 0 && (
				<p className="mt-1 text-xs font-medium text-slate-500">
					No unlinked matches found for this team in the loaded season.
				</p>
			)}
		</label>
	);
}

function MatchDetailsFields({
	details,
	label,
	onChange,
}: {
	details: MatchDetails;
	label: string;
	onChange: (details: MatchDetails) => void;
}) {
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-4">
			<h4 className="text-sm font-bold text-slate-900">{label}</h4>

			<div className="mt-4 space-y-4">
				<label className="block text-sm font-semibold text-slate-700">
					Opponent
					<input
						type="text"
						value={details.opponent}
						onChange={(event) => onChange({ ...details, opponent: event.target.value })}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
					/>
				</label>

				<label className="block text-sm font-semibold text-slate-700">
					Home/Away
					<select
						value={details.venue}
						onChange={(event) => onChange({ ...details, venue: event.target.value as EventMatchVenue })}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
					>
						<option value="Home">Home</option>
						<option value="Away">Away</option>
					</select>
				</label>

				<label className="block text-sm font-semibold text-slate-700">
					Competition
					<input
						type="text"
						value={details.competition}
						onChange={(event) => onChange({ ...details, competition: event.target.value })}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
					/>
				</label>

				<label className="block text-sm font-semibold text-slate-700">
					Venue / location
					<input
						type="text"
						value={details.location}
						onChange={(event) => onChange({ ...details, location: event.target.value })}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
					/>
				</label>
			</div>
		</section>
	);
}

function getTeamsForScope(teamScope: ClubEventTeamScope): EventClubTeam[] {
	if (teamScope === "First") {
		return ["First"];
	}

	if (teamScope === "Second") {
		return ["Second"];
	}

	return ["First", "Second"];
}

function getAvailableMatchesForTeam(matches: Match[], team: ClubTeam) {
	return [...matches]
		.filter((match) => match.team === team && !match.clubEventId)
		.sort(
			(firstMatch, secondMatch) =>
				new Date(firstMatch.date).getTime() - new Date(secondMatch.date).getTime()
		);
}

function buildCreateMatchRequest({
	details,
	eventLocation,
	eventStartDateTime,
	seasonId,
	team,
}: {
	details: MatchDetails;
	eventLocation: string;
	eventStartDateTime: string;
	seasonId: string;
	team: EventClubTeam;
}) {
	return {
		seasonId,
		team,
		opponent: details.opponent.trim(),
		competition: details.competition.trim(),
		date: new Date(eventStartDateTime).toISOString(),
		venue: details.venue,
		location: details.location.trim() || eventLocation.trim(),
		selectedFormation: "FourThreeThree" as const,
	};
}

function formatMatchOption(match: Match) {
	return `${formatShortDate(match.date)} · ${match.opponent} · ${match.venue === "home" ? "Home" : "Away"}`;
}

function formatShortDate(value: string) {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "Date TBC";
	}

	return date.toLocaleString("en-GB", {
		day: "2-digit",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}
