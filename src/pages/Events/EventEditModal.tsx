import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import type { ClubEvent, UpdateClubEventRequest } from "../../types/events";
import { formatDateForInput } from "../../utils/date";
import LocationPicker from "../../components/locations/LocationPicker";

export default function EventEditModal({
	event,
	isOpen,
	onClose,
	onSave,
}: {
	event: ClubEvent;
	isOpen: boolean;
	onClose: () => void;
	onSave: (request: UpdateClubEventRequest) => Promise<void>;
}) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [start, setStart] = useState("");
	const [end, setEnd] = useState("");
	const [location, setLocation] = useState("");
	const [error, setError] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		setTitle(event.title);
		setDescription(event.description);
		setStart(formatDateForInput(event.startDateTime));
		setEnd(event.endDateTime ? formatDateForInput(event.endDateTime) : "");
		setLocation(event.location);
		setError("");
	}, [event, isOpen]);

	if (!isOpen) return null;

	async function handleSubmit(formEvent: FormEvent) {
		formEvent.preventDefault();
		if (!title.trim() || !start) {
			setError("Title and start date are required.");
			return;
		}
		if (end && new Date(end) < new Date(start)) {
			setError("End date cannot be before the start date.");
			return;
		}

		setIsSaving(true);
		setError("");
		try {
			await onSave({
				type: event.type,
				teamScope: event.teamScope,
				teamIds: event.teamIds ?? [],
				title: title.trim(),
				description: description.trim(),
				startDateTime: new Date(start).toISOString(),
				endDateTime: end ? new Date(end).toISOString() : null,
				location: location.trim(),
				matchLinks: event.matchLinks,
				trainingPlanDrills: event.trainingPlanDrills ?? [],
			});
			onClose();
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Could not update event.");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-3 sm:p-6">
			<form onSubmit={handleSubmit} className="mx-auto mt-8 w-full max-w-xl space-y-4 rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
				<div className="flex items-start justify-between gap-3">
					<div><p className="text-xs font-black uppercase tracking-wide text-yepset-700">Edit event</p><h2 className="mt-1 text-xl font-black text-slate-950">{event.type} details</h2></div>
					<button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100">Close</button>
				</div>
				{event.type === "Match" && <p className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-800">Changing the date or location also updates the linked match.</p>}
				{error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
				<Field label="Title"><input value={title} onChange={(value) => setTitle(value.target.value)} className="w-full rounded-lg border px-3 py-2" /></Field>
				<Field label="Description"><textarea value={description} onChange={(value) => setDescription(value.target.value)} rows={3} className="w-full rounded-lg border px-3 py-2" /></Field>
				<div className="grid gap-3 sm:grid-cols-2">
					<Field label="Starts"><input type="datetime-local" value={start} onChange={(value) => setStart(value.target.value)} className="w-full rounded-lg border px-3 py-2" /></Field>
					<Field label="Ends"><input type="datetime-local" value={end} onChange={(value) => setEnd(value.target.value)} className="w-full rounded-lg border px-3 py-2" /></Field>
				</div>
				<LocationPicker
					value={location}
					onChange={setLocation}
					required={event.type === "Match"}
				/>
				<button type="submit" disabled={isSaving} className="w-full rounded-xl bg-yepset-700 px-4 py-3 text-sm font-black text-white disabled:opacity-60">{isSaving ? "Saving…" : "Save changes"}</button>
			</form>
		</div>
	);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
	return <label className="block space-y-1"><span className="text-sm font-bold text-slate-700">{label}</span>{children}</label>;
}
