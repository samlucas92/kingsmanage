import type { MatchNotes } from "../../../../stores/match";

interface MatchNotesCardProps {
	noteDraft: MatchNotes;
	notesSaved: boolean;
	onUpdateNoteDraft: (field: keyof MatchNotes, value: string) => void;
	onSaveNotes: () => void;
}

export function MatchNotesCard({
	noteDraft,
	notesSaved,
	onUpdateNoteDraft,
	onSaveNotes,
}: MatchNotesCardProps) {
	return (
		<section className="rounded-xl bg-white p-6 shadow">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h2 className="text-lg font-bold text-blue-900">Match Notes</h2>

					<p className="mt-1 text-xs text-slate-500">
						Availability, tactics, injuries and general notes.
					</p>
				</div>

				{notesSaved && (
					<span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
						Saved
					</span>
				)}
			</div>

			<div className="mt-4 space-y-3">
				<label className="block space-y-1">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
						Availability
					</span>

					<textarea
						value={noteDraft.availability}
						onChange={(event) =>
							onUpdateNoteDraft("availability", event.target.value)
						}
						rows={3}
						className="w-full rounded-lg border px-3 py-2 text-sm"
						placeholder="Who is available, late, missing or doubtful?"
					/>
				</label>

				<label className="block space-y-1">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
						Tactical
					</span>

					<textarea
						value={noteDraft.tactical}
						onChange={(event) =>
							onUpdateNoteDraft("tactical", event.target.value)
						}
						rows={3}
						className="w-full rounded-lg border px-3 py-2 text-sm"
						placeholder="Shape, instructions, set pieces, opposition notes..."
					/>
				</label>

				<label className="block space-y-1">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
						Injuries
					</span>

					<textarea
						value={noteDraft.injuries}
						onChange={(event) =>
							onUpdateNoteDraft("injuries", event.target.value)
						}
						rows={2}
						className="w-full rounded-lg border px-3 py-2 text-sm"
						placeholder="Knocks, restrictions, players returning..."
					/>
				</label>

				<label className="block space-y-1">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
						General
					</span>

					<textarea
						value={noteDraft.general}
						onChange={(event) =>
							onUpdateNoteDraft("general", event.target.value)
						}
						rows={2}
						className="w-full rounded-lg border px-3 py-2 text-sm"
						placeholder="Anything else to remember..."
					/>
				</label>

				<button
					type="button"
					onClick={onSaveNotes}
					className="w-full rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
				>
					Save Notes
				</button>
			</div>
		</section>
	);
}