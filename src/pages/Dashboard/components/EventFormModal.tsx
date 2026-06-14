import { useState, type FormEvent } from "react";

import type {
	ClubEventTeamScope,
	ClubEventType,
	CreateClubEventRequest,
	EventMatchVenue,
} from "../../../types/events";

type EventFormModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onCreateEvent: (request: CreateClubEventRequest) => Promise<void>;
};

const eventTypes: ClubEventType[] = ["Match", "Training", "Social", "Meeting"];

export default function EventFormModal({
	isOpen,
	onClose,
	onCreateEvent,
}: EventFormModalProps) {
	const [type, setType] = useState<ClubEventType>("Training");
	const [teamScope, setTeamScope] = useState<ClubEventTeamScope>("Both");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startDateTime, setStartDateTime] = useState("");
	const [endDateTime, setEndDateTime] = useState("");
	const [location, setLocation] = useState("");
	const [matchMode, setMatchMode] = useState<"none" | "create">("none");
	const [firstOpponent, setFirstOpponent] = useState("");
	const [secondOpponent, setSecondOpponent] = useState("");
	const [venue, setVenue] = useState<EventMatchVenue>("Home");
	const [error, setError] = useState("");
	const [isSaving, setIsSaving] = useState(false);

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

		const createMatches = [];

		if (type === "Match" && matchMode === "create") {
			if ((teamScope === "First" || teamScope === "Both") && !firstOpponent.trim()) {
				setError("Enter the first team opponent.");
				return;
			}

			if ((teamScope === "Second" || teamScope === "Both") && !secondOpponent.trim()) {
				setError("Enter the second team opponent.");
				return;
			}

			if (teamScope === "First" || teamScope === "Both") {
				createMatches.push({
					seasonId: null,
					team: "First" as const,
					opponent: firstOpponent.trim(),
					date: new Date(startDateTime).toISOString(),
					venue,
					selectedFormation: "FourThreeThree" as const,
				});
			}

			if (teamScope === "Second" || teamScope === "Both") {
				createMatches.push({
					seasonId: null,
					team: "Second" as const,
					opponent: secondOpponent.trim(),
					date: new Date(startDateTime).toISOString(),
					venue,
					selectedFormation: "FourThreeThree" as const,
				});
			}
		}

		const request: CreateClubEventRequest = {
			type,
			teamScope,
			title: title.trim(),
			description: description.trim(),
			startDateTime: new Date(startDateTime).toISOString(),
			endDateTime: endDateTime ? new Date(endDateTime).toISOString() : null,
			location: location.trim(),
			matchLinks: [],
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
		setTeamScope("Both");
		setTitle("");
		setDescription("");
		setStartDateTime("");
		setEndDateTime("");
		setLocation("");
		setMatchMode("none");
		setFirstOpponent("");
		setSecondOpponent("");
		setVenue("Home");
		setError("");
		setIsSaving(false);
	}

	function handleTypeChange(nextType: ClubEventType) {
		setType(nextType);

		if (nextType !== "Match") {
			setMatchMode("none");
		}
	}

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 px-3 py-6 sm:px-6">
			<div className="mx-auto w-full max-w-3xl rounded-2xl bg-white shadow-xl">
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
								Events are season agnostic. Match creation only happens when explicitly selected.
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

					<div className="grid gap-4 md:grid-cols-2">
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

						<label className="block text-sm font-semibold text-slate-700">
							Team scope
							<select
								value={teamScope}
								onChange={(event) => setTeamScope(event.target.value as ClubEventTeamScope)}
								className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
							>
								<option value="First">First Team</option>
								<option value="Second">Second Team</option>
								<option value="Both">Both Teams</option>
							</select>
						</label>
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
							<h3 className="text-sm font-bold text-slate-900">Match creation</h3>
							<p className="mt-1 text-sm text-slate-500">
								Keep this as an event only, or explicitly create linked match records.
							</p>

							<div className="mt-4 grid gap-2 sm:grid-cols-2">
								<MatchModeButton
									isSelected={matchMode === "none"}
									label="Event only"
									onClick={() => setMatchMode("none")}
								/>
								<MatchModeButton
									isSelected={matchMode === "create"}
									label="Create match records"
									onClick={() => setMatchMode("create")}
								/>
							</div>

							{matchMode === "create" && (
								<div className="mt-4 space-y-4">
									<label className="block text-sm font-semibold text-slate-700">
										Venue
										<select
											value={venue}
											onChange={(event) => setVenue(event.target.value as EventMatchVenue)}
											className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
										>
											<option value="Home">Home</option>
											<option value="Away">Away</option>
										</select>
									</label>

									{(teamScope === "First" || teamScope === "Both") && (
										<label className="block text-sm font-semibold text-slate-700">
											First team opponent
											<input
												type="text"
												value={firstOpponent}
												onChange={(event) => setFirstOpponent(event.target.value)}
												className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
											/>
										</label>
									)}

									{(teamScope === "Second" || teamScope === "Both") && (
										<label className="block text-sm font-semibold text-slate-700">
											Second team opponent
											<input
												type="text"
												value={secondOpponent}
												onChange={(event) => setSecondOpponent(event.target.value)}
												className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
											/>
										</label>
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
