import { useState, type FormEvent } from "react";

import type {
	FundingApplicationState,
	FundingOpportunity,
	FundingOpportunityStatus,
	SaveFundingOpportunityRequest,
} from "../../types/funding";

type FundingOpportunityModalProps = {
	isOpen: boolean;
	opportunity: FundingOpportunity | null;
	isSaving: boolean;
	error: string;
	onClose: () => void;
	onSave: (request: SaveFundingOpportunityRequest) => Promise<void>;
	onDelete: (opportunity: FundingOpportunity) => Promise<void>;
};

const statusOptions: FundingOpportunityStatus[] = ["Open", "Upcoming", "Rolling", "Restricted", "Closed"];
const stateOptions: Array<{ value: FundingApplicationState; label: string }> = [
	{ value: "Investigating", label: "Investigating" },
	{ value: "Preparing", label: "Preparing application" },
	{ value: "Submitted", label: "Submitted" },
	{ value: "Completed", label: "Completed" },
	{ value: "Failed", label: "Unsuccessful" },
	{ value: "NotPursuing", label: "Not pursuing" },
];

const emptyDraft: SaveFundingOpportunityRequest = {
	name: "",
	description: "",
	amount: "",
	applicationUrl: "",
	startDate: null,
	endDate: null,
	status: "Open",
	statusDetail: "Open",
	applicationState: "Investigating",
	notes: "",
};

export default function FundingOpportunityModal({
	isOpen,
	opportunity,
	isSaving,
	error,
	onClose,
	onSave,
	onDelete,
}: FundingOpportunityModalProps) {
	const [draft, setDraft] = useState<SaveFundingOpportunityRequest>(() =>
		opportunity ? toDraft(opportunity) : emptyDraft
	);
	const [validationError, setValidationError] = useState("");

	if (!isOpen) return null;

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const nextError = validateDraft(draft);
		if (nextError) {
			setValidationError(nextError);
			return;
		}
		setValidationError("");
		await onSave({
			...draft,
			name: draft.name.trim(),
			description: draft.description.trim(),
			amount: draft.amount.trim(),
			applicationUrl: draft.applicationUrl.trim(),
			statusDetail: draft.statusDetail.trim() || draft.status,
			notes: draft.notes.trim(),
		});
	}

	function update<K extends keyof SaveFundingOpportunityRequest>(key: K, value: SaveFundingOpportunityRequest[K]) {
		setDraft((current) => ({ ...current, [key]: value }));
	}

	return (
		<div className="fixed inset-0 z-50 flex items-end bg-yepset-950/55 backdrop-blur-sm sm:items-center sm:justify-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="funding-modal-title">
			<button type="button" className="absolute inset-0" onClick={isSaving ? undefined : onClose} aria-label="Close funding opportunity" />
			<form onSubmit={(event) => void handleSubmit(event)} className="relative z-10 flex max-h-[96vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_24px_80px_rgba(8,42,40,.28)] sm:max-w-3xl sm:rounded-3xl">
				<header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7 sm:py-5">
					<div>
						<p className="text-xs font-black uppercase tracking-[.16em] text-yepset-700">Funding pipeline</p>
						<h2 id="funding-modal-title" className="mt-1 text-xl font-black tracking-[-.02em] text-slate-950 sm:text-2xl">{opportunity ? "Opportunity details" : "Add funding opportunity"}</h2>
					</div>
					<button type="button" onClick={onClose} disabled={isSaving} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-xl font-bold text-slate-500 hover:bg-slate-200 disabled:opacity-50" aria-label="Close">×</button>
				</header>

				<div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/70 p-5 sm:p-7">
					<div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
						<label className="sm:col-span-2">
							<FieldLabel>Name</FieldLabel>
							<input value={draft.name} onChange={(event) => update("name", event.target.value)} maxLength={200} required className="input-field mt-1.5" placeholder="Funding opportunity name" />
						</label>
						<label className="sm:col-span-2">
							<FieldLabel>Description</FieldLabel>
							<textarea value={draft.description} onChange={(event) => update("description", event.target.value)} maxLength={2000} rows={3} className="input-field mt-1.5 resize-y" placeholder="What can this funding be used for?" />
						</label>
						<label>
							<FieldLabel>Funding amount</FieldLabel>
							<input value={draft.amount} onChange={(event) => update("amount", event.target.value)} maxLength={100} className="input-field mt-1.5" placeholder="e.g. Up to £25,000" />
						</label>
						<label>
							<FieldLabel>Application link</FieldLabel>
							<input type="url" value={draft.applicationUrl} onChange={(event) => update("applicationUrl", event.target.value)} className="input-field mt-1.5" placeholder="https://…" />
						</label>
						<label>
							<FieldLabel>Start date</FieldLabel>
							<input type="date" value={dateInputValue(draft.startDate)} onChange={(event) => update("startDate", event.target.value || null)} className="input-field mt-1.5" />
						</label>
						<label>
							<FieldLabel>End date</FieldLabel>
							<input type="date" value={dateInputValue(draft.endDate)} onChange={(event) => update("endDate", event.target.value || null)} className="input-field mt-1.5" />
						</label>
						<label>
							<FieldLabel>Opportunity status</FieldLabel>
							<select value={draft.status} onChange={(event) => {
								const status = event.target.value as FundingOpportunityStatus;
								setDraft((current) => ({ ...current, status, statusDetail: status }));
							}} className="input-field mt-1.5">
								{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
							</select>
						</label>
						<label>
							<FieldLabel>Club progress</FieldLabel>
							<select value={draft.applicationState} onChange={(event) => update("applicationState", event.target.value as FundingApplicationState)} className="input-field mt-1.5">
								{stateOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
							</select>
						</label>
						<label className="sm:col-span-2">
							<FieldLabel>Internal notes</FieldLabel>
							<textarea value={draft.notes} onChange={(event) => update("notes", event.target.value)} maxLength={5000} rows={4} className="input-field mt-1.5 resize-y" placeholder="Contacts, next actions or application notes…" />
						</label>
					</div>

					{(validationError || error) && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{validationError || error}</div>}
				</div>

				<footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
					<div>
						{opportunity && <button type="button" disabled={isSaving} onClick={() => void onDelete(opportunity)} className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 sm:w-auto">Delete opportunity</button>}
					</div>
					<div className="flex gap-3">
						<button type="button" disabled={isSaving} onClick={onClose} className="btn-secondary flex-1 sm:flex-none">Cancel</button>
						<button type="submit" disabled={isSaving} className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none">{isSaving ? "Saving…" : opportunity ? "Save changes" : "Add opportunity"}</button>
					</div>
				</footer>
			</form>
		</div>
	);
}

function FieldLabel({ children }: { children: React.ReactNode }) {
	return <span className="text-xs font-black uppercase tracking-wide text-slate-500">{children}</span>;
}

function toDraft(opportunity: FundingOpportunity): SaveFundingOpportunityRequest {
	return {
		name: opportunity.name,
		description: opportunity.description,
		amount: opportunity.amount,
		applicationUrl: opportunity.applicationUrl,
		startDate: opportunity.startDate,
		endDate: opportunity.endDate,
		status: opportunity.status,
		statusDetail: opportunity.statusDetail,
		applicationState: opportunity.applicationState,
		notes: opportunity.notes,
	};
}

function dateInputValue(value?: string | null) {
	return value?.slice(0, 10) ?? "";
}

function validateDraft(draft: SaveFundingOpportunityRequest) {
	if (!draft.name.trim()) return "Opportunity name is required.";
	if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) return "End date cannot be before the start date.";
	return "";
}
