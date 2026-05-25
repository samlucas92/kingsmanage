import type { MatchNotes } from "../../../../stores/match";
import PanelCard from "../../../../components/compositions/PanelCard";
import StatusBadge from "../../../../components/compositions/StatusBadge";

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
	const noteEntries = Object.entries(noteDraft) as [keyof MatchNotes, string][];

	const characterCount = noteEntries.reduce(
		(total, [, value]) => total + value.length,
		0
	);

	return (
		<PanelCard
			title="Match Notes"
			description="Add a general match report, summary or notes for this fixture."
			action={
				<StatusBadge
					label={notesSaved ? "Saved" : "Unsaved"}
					tone={notesSaved ? "success" : "warning"}
				/>
			}
		>
			<div className="space-y-4">
				{noteEntries.map(([field, value]) => (
					<label key={String(field)} className="block">
						<span className="mb-2 block text-sm font-semibold text-slate-700">
							{formatNoteFieldLabel(String(field))}
						</span>

						<textarea
							value={value}
							onChange={(event) =>
								onUpdateNoteDraft(field, event.target.value)
							}
							className="min-h-28 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:min-h-32"
							placeholder={getNotePlaceholder(String(field))}
						/>
					</label>
				))}
			</div>

			<div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-xs text-slate-500">
					{characterCount} {characterCount === 1 ? "character" : "characters"}
				</p>

				<button
					type="button"
					onClick={onSaveNotes}
					className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 sm:w-auto"
				>
					Save Notes
				</button>
			</div>

			{notesSaved && (
				<p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
					Notes saved for this match.
				</p>
			)}
		</PanelCard>
	);
}

function formatNoteFieldLabel(field: string) {
	return field
		.replace(/([A-Z])/g, " $1")
		.replace(/[_-]/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/^./, (character) => character.toUpperCase());
}

function getNotePlaceholder(field: string) {
	const lowerField = field.toLowerCase();

	if (lowerField.includes("summary") || lowerField.includes("report")) {
		return "Write the overall match summary...";
	}

	if (lowerField.includes("positive")) {
		return "What went well?";
	}

	if (
		lowerField.includes("improve") ||
		lowerField.includes("negative") ||
		lowerField.includes("concern")
	) {
		return "What needs improving?";
	}

	if (lowerField.includes("injur")) {
		return "Record any injuries or fitness concerns...";
	}

	if (lowerField.includes("availability")) {
		return "Record availability or selection notes...";
	}

	return "Add notes for this section...";
}