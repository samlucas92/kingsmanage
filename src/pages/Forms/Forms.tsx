import { useEffect, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import ActionMenu from "../../components/compositions/ActionMenu";
import ConfirmationModal from "../../components/compositions/ConfirmationModal";
import DataTable from "../../components/compositions/DataTable";
import Modal from "../../components/compositions/Modal";
import { formsApi } from "../../services/formsApi";
import { useAuthStore } from "../../stores/auth";
import { useMatchStore } from "../../stores/match";
import { usePlayerStore, type Player } from "../../stores/players";
import type {
	ClubForm,
	ClubFormAnswer,
	ClubFormQuestion,
	ClubFormQuestionOption,
	ClubFormQuestionResult,
	ClubFormQuestionType,
	ClubFormResults,
	ClubFormStatus,
	SaveClubFormRequest,
} from "../../types/forms";
import { formatDisplayDateTime } from "../../utils/date";

const questionTypes: ClubFormQuestionType[] = [
	"ShortText",
	"LongText",
	"SingleChoice",
	"MultipleChoice",
	"Rating",
	"YesNo",
];

const pageSize = 10;
const anonymousSubmissionStorageKey = "yepset.forms.anonymousSubmissionKey";

export default function Forms() {
	const { formId, goCode } = useParams<{ formId: string; goCode: string }>();
	const location = useLocation();
	const navigate = useNavigate();
	const currentUser = useAuthStore((state) => state.currentUser);
	const isPublicForm = Boolean(goCode);
	const isEditorMode = location.pathname.endsWith("/edit");
	const isReportMode = location.pathname.endsWith("/report");
	const canManageForms = !isPublicForm && (currentUser?.role === "Admin" || currentUser?.role === "Coach");

	const [forms, setForms] = useState<ClubForm[]>([]);
	const [form, setForm] = useState<ClubForm | null>(null);
	const [results, setResults] = useState<ClubFormResults | null>(null);
	const [answers, setAnswers] = useState<Record<string, DraftAnswer>>({});
	const [editingForm, setEditingForm] = useState<SaveClubFormRequest | null>(null);
	const [page, setPage] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [deleteTarget, setDeleteTarget] = useState<ClubForm | null>(null);
	const [cleanupMatchAward, setCleanupMatchAward] = useState(false);
	const [copyModalOpen, setCopyModalOpen] = useState(false);
	const [selectedCopyQuestions, setSelectedCopyQuestions] = useState<Set<string>>(new Set());

	useEffect(() => {
		if (goCode) {
			void loadPublicForm(goCode);
			return;
		}

		if (formId) {
			void loadFormDetail(formId);
			return;
		}

		void loadForms();
	}, [formId, goCode, location.pathname]);

	useEffect(() => {
		if (!isEditorMode || !form) {
			return;
		}

		setEditingForm(toEditableForm(form));
	}, [form, isEditorMode]);

	useEffect(() => {
		if (!results) {
			return;
		}

		setSelectedCopyQuestions(new Set(results.questions.map((question) => question.questionId)));
	}, [results]);

	const canSubmitSelectedForm = form?.status === "Open" &&
		(!form.hasSubmitted || form.allowMultipleSubmissions);
	const totalPages = Math.max(1, Math.ceil(forms.length / pageSize));
	const pageForms = forms.slice((page - 1) * pageSize, page * pageSize);

	async function loadForms() {
		setIsLoading(true);
		setError("");

		try {
			const loadedForms = await formsApi.getForms();
			setForms(loadedForms);
			setPage((current) => Math.min(current, Math.max(1, Math.ceil(loadedForms.length / pageSize))));
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to load forms.");
		} finally {
			setIsLoading(false);
		}
	}

	async function loadFormDetail(id: string) {
		setIsLoading(true);
		setError("");
		setMessage("");

		try {
			const loadedForm = await formsApi.getForm(id);
			setForm(loadedForm);
			setAnswers(buildInitialAnswers(loadedForm));
			if (canManageForms && (isReportMode || isEditorMode)) {
				setResults(await formsApi.getResults(id));
			}
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to load form.");
		} finally {
			setIsLoading(false);
		}
	}

	async function loadPublicForm(code: string) {
		setIsLoading(true);
		setError("");
		setMessage("");

		try {
			const loadedForm = await formsApi.getPublicForm(code, getAnonymousSubmissionKey());
			setForm(loadedForm);
			setAnswers(buildInitialAnswers(loadedForm));
		} catch (error) {
			setForm(null);
			setError(error instanceof Error ? error.message : "Failed to load form.");
		} finally {
			setIsLoading(false);
		}
	}

	function openCreateForm() {
		setForm(null);
		setEditingForm({
			title: "",
			description: "",
			status: "Draft",
			formType: "Custom",
			sourceType: "General",
			sourceMatchId: null,
			allowAnonymousResponses: true,
			allowMultipleSubmissions: false,
			questions: [createQuestion()],
		});
	}

	async function saveEditingForm(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!editingForm) return;

		setIsSaving(true);
		setError("");

		try {
			const request = normaliseFormRequest(editingForm);
			const saved = formId
				? await formsApi.updateForm(formId, request)
				: await formsApi.createForm(request);
			setEditingForm(null);
			navigate(`/forms/${saved.id}/report`);
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to save form.");
		} finally {
			setIsSaving(false);
		}
	}

	async function updateState(formToUpdate: ClubForm) {
		const nextStatus: ClubFormStatus = formToUpdate.status === "Closed" ? "Open" : "Closed";
		setError("");
		setMessage("");

		try {
			const updated = await formsApi.updateStatus(formToUpdate.id, nextStatus);
			if (updated.sourceMatchId) {
				await useMatchStore.getState().loadMatch(updated.sourceMatchId, true);
			}
			setForms((current) => current.map((item) => item.id === updated.id ? updated : item));
			setForm((current) => current?.id === updated.id ? updated : current);
			setMessage(nextStatus === "Closed"
				? "Form closed. If this was a match awards form, Man of the Match has been applied."
				: "Form reopened.");
			if (formId) {
				await loadFormDetail(formId);
			}
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to update form state.");
		}
	}

	async function confirmDeleteForm() {
		if (!deleteTarget) return;

		setIsSaving(true);
		setError("");

		try {
			await formsApi.deleteFormWithOptions(deleteTarget.id, cleanupMatchAward);
			setDeleteTarget(null);
			setCleanupMatchAward(false);
			if (formId) {
				navigate("/forms");
				return;
			}
			await loadForms();
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to delete form.");
		} finally {
			setIsSaving(false);
		}
	}

	async function shareForm(formToShare: ClubForm) {
		const url = `${window.location.origin}/go/${formToShare.goCode}`;

		try {
			await navigator.clipboard.writeText(url);
			setMessage("Share link copied to clipboard.");
		} catch {
			window.prompt("Copy form link", url);
		}
	}

	async function submitForm(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!form || !canSubmitSelectedForm) return;

		setIsSaving(true);
		setError("");
		setMessage("");

		try {
			const submitted = isPublicForm && goCode
				? await formsApi.submitPublicForm(goCode, {
					anonymousSubmissionKey: getAnonymousSubmissionKey(),
					answers: buildSubmissionAnswers(form, answers),
				})
				: await formsApi.submitForm(form.id, {
					answers: buildSubmissionAnswers(form, answers),
				});
			setForm(submitted);
			setMessage("Thanks — your response has been submitted.");
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to submit form.");
		} finally {
			setIsSaving(false);
		}
	}

	function updateEditingQuestion(index: number, question: ClubFormQuestion) {
		if (!editingForm) return;
		setEditingForm({
			...editingForm,
			questions: editingForm.questions.map((item, itemIndex) => itemIndex === index ? question : item),
		});
	}

	async function copySelectedResults() {
		if (!results) return;
		const selectedResults = results.questions.filter((question) => selectedCopyQuestions.has(question.questionId));
		const text = [
			results.title,
			...selectedResults.map((question) => `${question.prompt}: ${getTopAnswer(question)}`),
		].join("\n");

		try {
			await navigator.clipboard.writeText(text);
			setCopyModalOpen(false);
			setMessage("Results copied to clipboard.");
		} catch {
			window.prompt("Copy results", text);
		}
	}

	if (isPublicForm) {
		return (
			<div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(21,128,113,.16),transparent_32%),#f8fafc] px-4 py-8 text-slate-900">
				<div className="mx-auto max-w-3xl">
					<div className="mb-5 rounded-2xl bg-yepset-700 px-5 py-4 text-white shadow-lg">
						<p className="text-xs font-black uppercase tracking-[.25em] text-kick-300">Yepset</p>
						<h1 className="mt-1 text-xl font-black">Club form</h1>
					</div>
					<FormSubmissionView
						error={error}
						form={form}
						isLoading={isLoading}
						isSaving={isSaving}
						message={message}
						answers={answers}
						canSubmit={Boolean(canSubmitSelectedForm)}
						onAnswerChange={(questionId, value) => setAnswers((current) => ({ ...current, [questionId]: value }))}
						onSubmit={submitForm}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4 lg:space-y-6">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<h1 className="text-2xl font-black tracking-[-.03em] text-slate-950">Forms</h1>
					<p className="mt-1 text-sm text-slate-600">Manage club forms, match awards and response reports.</p>
				</div>

				{canManageForms && !formId && (
					<button type="button" onClick={openCreateForm} className="btn-primary">
						New form
					</button>
				)}
			</div>

			{error && <Alert tone="error">{error}</Alert>}
			{message && <Alert tone="success">{message}</Alert>}

			{isEditorMode ? (
				<FormEditor
					editingForm={editingForm}
					isSaving={isSaving}
					onCancel={() => formId ? navigate(`/forms/${formId}/report`) : setEditingForm(null)}
					onChange={setEditingForm}
					onQuestionChange={updateEditingQuestion}
					onSubmit={saveEditingForm}
				/>
			) : isReportMode ? (
				<FormReportView
					form={form}
					results={results}
					isLoading={isLoading}
					onBack={() => navigate("/forms")}
					onCopy={() => setCopyModalOpen(true)}
					onEdit={() => form && navigate(`/forms/${form.id}/edit`)}
					onGoToForm={() => form && navigate(`/go/${form.goCode}`)}
					onShare={() => form && void shareForm(form)}
					onToggleState={() => form && void updateState(form)}
					onDelete={() => form && setDeleteTarget(form)}
				/>
			) : editingForm ? (
				<FormEditor
					editingForm={editingForm}
					isSaving={isSaving}
					onCancel={() => setEditingForm(null)}
					onChange={setEditingForm}
					onQuestionChange={updateEditingQuestion}
					onSubmit={saveEditingForm}
				/>
			) : (
				<FormsList
					forms={pageForms}
					isLoading={isLoading}
					page={page}
					totalPages={totalPages}
					onDelete={(form) => setDeleteTarget(form)}
					onEdit={(form) => navigate(`/forms/${form.id}/edit`)}
					onGoToForm={(form) => navigate(`/go/${form.goCode}`)}
					onPageChange={setPage}
					onReport={(form) => navigate(`/forms/${form.id}/report`)}
					onShare={shareForm}
					onToggleState={updateState}
				/>
			)}

			<ConfirmationModal
				isOpen={Boolean(deleteTarget)}
				title="Delete form?"
				message={deleteTarget ? `This deletes “${deleteTarget.title}” and all responses.` : undefined}
				confirmText="Delete form"
				variant="danger"
				isBusy={isSaving}
				onCancel={() => {
					setDeleteTarget(null);
					setCleanupMatchAward(false);
				}}
				onConfirm={confirmDeleteForm}
			>
				{deleteTarget?.sourceType === "MatchAwards" && (
					<label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
						<input
							type="checkbox"
							checked={cleanupMatchAward}
							onChange={(event) => setCleanupMatchAward(event.target.checked)}
							className="mt-1"
						/>
						<span>
							Remove generated Man of the Match from the match stats
							<span className="mt-1 block text-xs font-medium text-slate-500">
								Leave unchecked if you have manually corrected or want to keep the match award.
							</span>
						</span>
					</label>
				)}
			</ConfirmationModal>

			<ConfirmationModal
				isOpen={copyModalOpen}
				title="Copy results"
				message="Choose which question winners to include."
				confirmText="Copy results"
				onCancel={() => setCopyModalOpen(false)}
				onConfirm={copySelectedResults}
			>
				<div className="space-y-2">
					{results?.questions.map((question) => (
						<label key={question.questionId} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
							<input
								type="checkbox"
								checked={selectedCopyQuestions.has(question.questionId)}
								onChange={(event) => {
									setSelectedCopyQuestions((current) => {
										const next = new Set(current);
										if (event.target.checked) {
											next.add(question.questionId);
										} else {
											next.delete(question.questionId);
										}
										return next;
									});
								}}
							/>
							{question.prompt}
						</label>
					))}
				</div>
			</ConfirmationModal>
		</div>
	);
}

type DraftAnswer = {
	textValue: string;
	selectedOptions: string[];
	ratingValue?: number | null;
	booleanValue?: boolean | null;
};

function FormsList({
	forms,
	isLoading,
	page,
	totalPages,
	onDelete,
	onEdit,
	onGoToForm,
	onPageChange,
	onReport,
	onShare,
	onToggleState,
}: {
	forms: ClubForm[];
	isLoading: boolean;
	page: number;
	totalPages: number;
	onDelete: (form: ClubForm) => void;
	onEdit: (form: ClubForm) => void;
	onGoToForm: (form: ClubForm) => void;
	onPageChange: (page: number) => void;
	onReport: (form: ClubForm) => void;
	onShare: (form: ClubForm) => void | Promise<void>;
	onToggleState: (form: ClubForm) => void | Promise<void>;
}) {
	if (isLoading) {
		return <p className="surface-card p-4 text-sm font-semibold text-slate-500">Loading forms...</p>;
	}

	return (
		<section className="surface-card overflow-hidden">
			{forms.length === 0 ? (
				<div className="p-6 text-center">
					<p className="text-base font-black text-slate-950">No forms yet</p>
					<p className="mt-1 text-sm text-slate-500">Create a form or generate awards from a match.</p>
				</div>
			) : (
				<>
					<div className="divide-y divide-slate-100 lg:hidden">
						{forms.map((form) => (
							<div key={form.id} className="space-y-3 p-4">
								<div className="flex items-start justify-between gap-3">
									<button type="button" onClick={() => onReport(form)} className="min-w-0 text-left text-lg font-black leading-tight text-yepset-800">
										{form.title}
									</button>
									<ActionMenu
										items={getFormActionItems({
											form,
											onDelete,
											onEdit,
											onGoToForm,
											onReport,
											onShare,
											onToggleState,
										})}
									/>
								</div>

								<div className="flex flex-wrap items-center gap-2">
									<StatusPill status={form.status} />
									{form.sourceMatchLabel && (
										<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
											{form.sourceMatchLabel}
										</span>
									)}
								</div>

								<dl className="grid gap-2 text-sm">
									<div>
										<dt className="text-xs font-black uppercase tracking-wide text-slate-400">Date created</dt>
										<dd className="mt-0.5 font-semibold text-slate-700">{formatDisplayDateTime(form.createdAt)}</dd>
									</div>
								</dl>
							</div>
						))}
					</div>

					<DataTable
						className="hidden lg:block"
						empty={false}
						minWidthClassName="min-w-0"
						tableClassName="table-fixed"
					>
						<thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
							<tr>
								<th className="w-[34%] px-4 py-3">Name</th>
								<th className="w-[24%] px-4 py-3">Match</th>
								<th className="w-[8%] px-4 py-3">State</th>
								<th className="w-[22%] px-4 py-3">Date created</th>
								<th className="w-[12%] px-4 py-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{forms.map((form) => (
								<tr key={form.id}>
									<td className="px-4 py-3">
										<button type="button" onClick={() => onReport(form)} className="block max-w-full truncate text-left font-black text-yepset-800 hover:underline">
											{form.title}
										</button>
									</td>
									<td className="truncate px-4 py-3 text-slate-600">{form.sourceMatchLabel || "—"}</td>
									<td className="px-4 py-3"><StatusPill status={form.status} /></td>
									<td className="truncate px-4 py-3 text-slate-600">{formatDisplayDateTime(form.createdAt)}</td>
									<td className="px-4 py-3">
										<div className="flex justify-end">
											<ActionMenu
												items={getFormActionItems({
													form,
													onDelete,
													onEdit,
													onGoToForm,
													onReport,
													onShare,
													onToggleState,
												})}
											/>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</DataTable>
				</>
			)}
			<div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
				<span>Page {page} of {totalPages}</span>
				<div className="flex gap-2">
					<button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="btn-secondary px-3 py-2 disabled:opacity-50">Previous</button>
					<button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="btn-secondary px-3 py-2 disabled:opacity-50">Next</button>
				</div>
			</div>
		</section>
	);
}

function getFormActionItems({
	form,
	onDelete,
	onEdit,
	onGoToForm,
	onReport,
	onShare,
	onToggleState,
}: {
	form: ClubForm;
	onDelete: (form: ClubForm) => void;
	onEdit: (form: ClubForm) => void;
	onGoToForm: (form: ClubForm) => void;
	onReport: (form: ClubForm) => void;
	onShare: (form: ClubForm) => void | Promise<void>;
	onToggleState: (form: ClubForm) => void | Promise<void>;
}) {
	return [
		{ label: "Go to form", onClick: () => onGoToForm(form) },
		{ label: "Edit", onClick: () => onEdit(form) },
		{ label: form.status === "Closed" ? "Open form" : "Close form", onClick: () => void onToggleState(form) },
		{ label: "Report", onClick: () => onReport(form) },
		{ label: "Share", onClick: () => void onShare(form) },
		{ label: "Delete", onClick: () => onDelete(form), tone: "danger" as const },
	];
}

function FormReportView({
	form,
	results,
	isLoading,
	onBack,
	onCopy,
	onDelete,
	onEdit,
	onGoToForm,
	onShare,
	onToggleState,
}: {
	form: ClubForm | null;
	results: ClubFormResults | null;
	isLoading: boolean;
	onBack: () => void;
	onCopy: () => void;
	onDelete: () => void;
	onEdit: () => void;
	onGoToForm: () => void;
	onShare: () => void;
	onToggleState: () => void;
}) {
	if (isLoading) {
		return <p className="surface-card p-4 text-sm font-semibold text-slate-500">Loading report...</p>;
	}

	if (!form) {
		return <p className="surface-card p-4 text-sm font-semibold text-slate-500">Form not found.</p>;
	}

	return (
		<section className="surface-card p-4 lg:p-6">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<button type="button" onClick={onBack} className="mb-3 text-sm font-black uppercase tracking-wide text-yepset-800">← Back to forms</button>
					<div className="flex flex-wrap items-center gap-2">
						<StatusPill status={form.status} />
						{form.sourceMatchLabel && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">{form.sourceMatchLabel}</span>}
					</div>
					<h2 className="mt-3 text-2xl font-black tracking-[-.03em] text-slate-950">{form.title}</h2>
					{form.description && <p className="mt-2 text-sm leading-6 text-slate-600">{form.description}</p>}
					<p className="mt-2 text-xs text-slate-400">Created by {form.createdByUserEmail || "Unknown"} · {formatDisplayDateTime(form.createdAt)}</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<button type="button" onClick={onGoToForm} className="btn-primary">Go to form</button>
					<button type="button" onClick={onCopy} disabled={form.status !== "Closed"} className="btn-secondary disabled:opacity-50">Copy results</button>
					<button type="button" onClick={onShare} className="btn-secondary">Share</button>
					<button type="button" onClick={onEdit} className="btn-secondary">Edit</button>
					<button type="button" onClick={onToggleState} className="btn-secondary">{form.status === "Closed" ? "Open" : "Close"}</button>
					<button type="button" onClick={onDelete} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50">Delete</button>
				</div>
			</div>

			{results && <ResultsPanel results={results} />}
		</section>
	);
}

function FormSubmissionView({
	error,
	form,
	isLoading,
	isSaving,
	message,
	answers,
	canSubmit,
	onAnswerChange,
	onSubmit,
}: {
	error: string;
	form: ClubForm | null;
	isLoading: boolean;
	isSaving: boolean;
	message: string;
	answers: Record<string, DraftAnswer>;
	canSubmit: boolean;
	onAnswerChange: (questionId: string, value: DraftAnswer) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
	if (isLoading) {
		return <p className="surface-card p-4 text-sm font-semibold text-slate-500">Loading form...</p>;
	}

	if (!form) {
		return (
			<div className="surface-card space-y-3 p-4">
				{error && <Alert tone="error">{error}</Alert>}
				<p className="text-sm text-slate-500">This form could not be loaded.</p>
				<Link to="/login" className="btn-primary inline-flex">Sign in</Link>
			</div>
		);
	}

	return (
		<section className="surface-card p-4 lg:p-6">
			{error && <Alert tone="error">{error}</Alert>}
			{message && <Alert tone="success">{message}</Alert>}
			<div className="mb-5">
				<StatusPill status={form.status} />
				<h2 className="mt-3 text-2xl font-black tracking-[-.03em] text-slate-950">{form.title}</h2>
				{form.description && <p className="mt-2 text-sm leading-6 text-slate-600">{form.description}</p>}
			</div>

			{form.hasSubmitted && !form.allowMultipleSubmissions ? (
				<Alert tone="success">You have already submitted this form.</Alert>
			) : form.status !== "Open" ? (
				<Alert tone="error">This form is not open for responses.</Alert>
			) : (
				<form onSubmit={onSubmit} className="space-y-4">
					{form.questions.map((question) => (
						<FormQuestionInput
							key={question.id}
							question={question}
							value={answers[question.id]}
							onChange={(value) => onAnswerChange(question.id, value)}
						/>
					))}
					<button type="submit" disabled={isSaving || !canSubmit} className="btn-primary disabled:cursor-not-allowed disabled:bg-slate-300">
						Submit response
					</button>
				</form>
			)}
		</section>
	);
}

function FormEditor({
	editingForm,
	isSaving,
	onCancel,
	onChange,
	onQuestionChange,
	onSubmit,
}: {
	editingForm: SaveClubFormRequest | null;
	isSaving: boolean;
	onCancel: () => void;
	onChange: (form: SaveClubFormRequest | null) => void;
	onQuestionChange: (index: number, question: ClubFormQuestion) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
	if (!editingForm) {
		return <p className="surface-card p-4 text-sm font-semibold text-slate-500">Loading editor...</p>;
	}

	return (
		<form onSubmit={onSubmit} className="surface-card overflow-hidden">
			<div className="border-b border-slate-200 px-5 py-4">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-xs font-black uppercase tracking-wide text-yepset-700">Form editor</p>
						<h2 className="mt-1 text-xl font-black text-slate-950">{editingForm.title || "New form"}</h2>
					</div>
					<button type="button" onClick={onCancel} className="btn-secondary">Close</button>
				</div>
			</div>

			<div className="space-y-4 px-5 py-5">
				<label className="block text-sm font-bold text-slate-700">
					Title
					<input value={editingForm.title} onChange={(event) => onChange({ ...editingForm, title: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" required />
				</label>

				<label className="block text-sm font-bold text-slate-700">
					Description
					<textarea value={editingForm.description} onChange={(event) => onChange({ ...editingForm, description: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" rows={3} />
				</label>

				<label className="block text-sm font-bold text-slate-700">
					Status
					<select value={editingForm.status} onChange={(event) => onChange({ ...editingForm, status: event.target.value as ClubFormStatus })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2">
						<option value="Draft">Draft</option>
						<option value="Open">Open</option>
						<option value="Closed">Closed</option>
					</select>
				</label>

				<div className="grid gap-3 sm:grid-cols-2">
					<label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
						<input type="checkbox" checked={editingForm.allowAnonymousResponses} onChange={(event) => onChange({ ...editingForm, allowAnonymousResponses: event.target.checked })} className="mt-1" />
						<span>Allow anonymous responses<span className="mt-1 block text-xs font-medium text-slate-500">If off, shared links require sign in.</span></span>
					</label>
					<label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
						<input type="checkbox" checked={editingForm.allowMultipleSubmissions} onChange={(event) => onChange({ ...editingForm, allowMultipleSubmissions: event.target.checked })} className="mt-1" />
						<span>Allow multiple submissions<span className="mt-1 block text-xs font-medium text-slate-500">If off, each user/browser can answer once.</span></span>
					</label>
				</div>

				<div className="space-y-3">
					<div className="flex items-center justify-between gap-3">
						<h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Questions</h3>
						<button type="button" onClick={() => onChange({ ...editingForm, questions: [...editingForm.questions, createQuestion()] })} className="btn-secondary">Add question</button>
					</div>
					{editingForm.questions.map((question, index) => (
						<QuestionEditor
							key={question.id}
							question={question}
							index={index}
							onChange={(updated) => onQuestionChange(index, updated)}
							onRemove={() => onChange({ ...editingForm, questions: editingForm.questions.filter((_, itemIndex) => itemIndex !== index) })}
							canRemove={editingForm.questions.length > 1}
						/>
					))}
				</div>
			</div>

			<div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
				<button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
				<button type="submit" disabled={isSaving} className="btn-primary disabled:cursor-not-allowed disabled:bg-slate-300">{isSaving ? "Saving..." : "Save form"}</button>
			</div>
		</form>
	);
}

function Alert({ children, tone }: { children: React.ReactNode; tone: "error" | "success" }) {
	const className = tone === "error"
		? "border-red-200 bg-red-50 text-red-700"
		: "border-green-200 bg-green-50 text-green-800";
	return <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${className}`}>{children}</div>;
}

function StatusPill({ status }: { status: ClubFormStatus }) {
	const className =
		status === "Open"
			? "bg-green-100 text-green-800"
			: status === "Closed"
				? "bg-red-100 text-red-800"
				: "bg-slate-100 text-slate-700";

	return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${className}`}>{status}</span>;
}

function FormQuestionInput({
	question,
	value,
	onChange,
}: {
	question: ClubFormQuestion;
	value?: DraftAnswer;
	onChange: (value: DraftAnswer) => void;
}) {
	const answer = value ?? { textValue: "", selectedOptions: [] };

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-4">
			<label className="block text-sm font-black text-slate-950">
				{question.prompt}
				{question.isRequired && <span className="ml-1 text-red-600">*</span>}
			</label>
			{question.type === "ShortText" && (
				<input value={answer.textValue} onChange={(event) => onChange({ ...answer, textValue: event.target.value })} required={question.isRequired} className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2" />
			)}
			{question.type === "LongText" && (
				<textarea value={answer.textValue} onChange={(event) => onChange({ ...answer, textValue: event.target.value })} required={question.isRequired} className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2" rows={4} />
			)}
			{question.type === "SingleChoice" && (
				<div className="mt-3 space-y-2">
					{getQuestionChoiceOptions(question).map((option) => (
						<label key={option.value} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
							<input type="radio" name={question.id} checked={answer.selectedOptions[0] === option.value} onChange={() => onChange({ ...answer, selectedOptions: [option.value] })} required={question.isRequired} />
							{option.label}
						</label>
					))}
				</div>
			)}
			{question.type === "MultipleChoice" && (
				<div className="mt-3 space-y-2">
					{getQuestionChoiceOptions(question).map((option) => (
						<label key={option.value} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
							<input
								type="checkbox"
								checked={answer.selectedOptions.includes(option.value)}
								onChange={(event) => onChange({
									...answer,
									selectedOptions: event.target.checked
										? [...answer.selectedOptions, option.value]
										: answer.selectedOptions.filter((item) => item !== option.value),
								})}
							/>
							{option.label}
						</label>
					))}
				</div>
			)}
			{question.type === "Rating" && (
				<select value={answer.ratingValue ?? ""} onChange={(event) => onChange({ ...answer, ratingValue: Number(event.target.value) || null })} required={question.isRequired} className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2">
					<option value="">Choose rating</option>
					{range(question.minRating, question.maxRating).map((rating) => <option key={rating} value={rating}>{rating}</option>)}
				</select>
			)}
			{question.type === "YesNo" && (
				<div className="mt-3 flex gap-4">
					<label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="radio" name={question.id} checked={answer.booleanValue === true} onChange={() => onChange({ ...answer, booleanValue: true })} required={question.isRequired} /> Yes</label>
					<label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="radio" name={question.id} checked={answer.booleanValue === false} onChange={() => onChange({ ...answer, booleanValue: false })} required={question.isRequired} /> No</label>
				</div>
			)}
		</div>
	);
}

function QuestionEditor({
	question,
	index,
	onChange,
	onRemove,
	canRemove,
}: {
	question: ClubFormQuestion;
	index: number;
	onChange: (question: ClubFormQuestion) => void;
	onRemove: () => void;
	canRemove: boolean;
}) {
	const isChoice = question.type === "SingleChoice" || question.type === "MultipleChoice";
	const choiceOptions = getQuestionChoiceOptions(question);
	const playerOptions = choiceOptions.filter((option) => option.playerId);
	const manualOptions = getManualQuestionOptions(question);

	return (
		<section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
			<div className="flex items-start justify-between gap-3">
				<p className="text-sm font-black text-slate-950">Question {index + 1}</p>
				{canRemove && <button type="button" onClick={onRemove} className="text-sm font-bold text-red-700">Remove</button>}
			</div>
			<div className="mt-3 grid gap-3 md:grid-cols-2">
				<label className="block text-sm font-bold text-slate-700 md:col-span-2">
					Prompt
					<input value={question.prompt} onChange={(event) => onChange({ ...question, prompt: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" required />
				</label>
				<label className="block text-sm font-bold text-slate-700">
					Type
					<select value={question.type} onChange={(event) => onChange(resetQuestionForType(question, event.target.value as ClubFormQuestionType))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2">
						{questionTypes.map((type) => <option key={type} value={type}>{formatQuestionType(type)}</option>)}
					</select>
				</label>
				<label className="mt-7 flex items-center gap-2 text-sm font-bold text-slate-700">
					<input type="checkbox" checked={question.isRequired} onChange={(event) => onChange({ ...question, isRequired: event.target.checked })} />
					Required
				</label>
			</div>
			{isChoice && (
				<ChoiceOptionEditor
					manualOptions={manualOptions}
					onChange={onChange}
					playerOptions={playerOptions}
					question={question}
				/>
			)}
			{question.type === "Rating" && (
				<div className="mt-3 grid gap-3 sm:grid-cols-2">
					<label className="block text-sm font-bold text-slate-700">Min<input type="number" min={1} max={10} value={question.minRating} onChange={(event) => onChange({ ...question, minRating: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" /></label>
					<label className="block text-sm font-bold text-slate-700">Max<input type="number" min={1} max={10} value={question.maxRating} onChange={(event) => onChange({ ...question, maxRating: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" /></label>
				</div>
			)}
		</section>
	);
}

function ChoiceOptionEditor({
	question,
	playerOptions,
	manualOptions,
	onChange,
}: {
	question: ClubFormQuestion;
	playerOptions: ClubFormQuestionOption[];
	manualOptions: string[];
	onChange: (question: ClubFormQuestion) => void;
}) {
	const players = usePlayerStore((state) => state.players);
	const hasLoadedPlayers = usePlayerStore((state) => state.hasLoadedPlayers);
	const isLoadingPlayers = usePlayerStore((state) => state.isLoadingPlayers);
	const playerLoadError = usePlayerStore((state) => state.playerLoadError);
	const loadPlayers = usePlayerStore((state) => state.loadPlayers);
	const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
	const [draftOption, setDraftOption] = useState("");
	const orderedOptions = getQuestionChoiceOptions(question);

	useEffect(() => {
		if (isPlayerModalOpen) {
			void loadPlayers();
		}
	}, [isPlayerModalOpen, loadPlayers]);

	function updateOptionLabels(labels: string[], choiceOptions = question.choiceOptions ?? []) {
		onChange({
			...question,
			options: mergeOrderedOptionLabels(labels, choiceOptions),
		});
	}

	function addManualOptions(values: string[]) {
		updateOptionLabels([...question.options, ...values]);
		setDraftOption("");
	}

	function removeManualOption(value: string) {
		updateOptionLabels(question.options.filter((option) => option.toLowerCase() !== value.toLowerCase()));
	}

	function commitDraftOption() {
		if (!draftOption.trim()) {
			setDraftOption("");
			return;
		}

		addManualOptions(splitOptionInput(draftOption));
	}

	function handleDraftKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === "Enter" || event.key === ",") {
			event.preventDefault();
			commitDraftOption();
		}

		if (event.key === "Backspace" && !draftOption && manualOptions.length > 0) {
			removeManualOption(manualOptions[manualOptions.length - 1]);
		}
	}

	function handleOptionPaste(event: ClipboardEvent<HTMLInputElement>) {
		const pastedText = event.clipboardData.getData("text");
		const pastedOptions = splitOptionInput(pastedText);
		if (pastedOptions.length <= 1) {
			return;
		}

		event.preventDefault();
		addManualOptions(pastedOptions);
	}

	function addPlayers(selectedPlayers: Player[]) {
		const existingValues = new Set((question.choiceOptions ?? []).map((option) => option.value.toLowerCase()));
		const playerChoiceOptions = selectedPlayers
			.filter((player) => !existingValues.has(player.id.toLowerCase()))
			.map((player) => ({
				value: player.id,
				label: player.name,
				playerId: player.id,
			}));

		if (playerChoiceOptions.length === 0) {
			return;
		}

		const choiceOptions = [...(question.choiceOptions ?? []), ...playerChoiceOptions];
		onChange({
			...question,
			optionSource: "MatchPlayers",
			choiceOptions,
			options: mergeOrderedOptionLabels([
				...question.options,
				...playerChoiceOptions.map((option) => option.label),
			], choiceOptions),
		});
	}

	function removeChoiceOption(value: string) {
		const removedOption = (question.choiceOptions ?? []).find((option) => option.value === value);
		const choiceOptions = (question.choiceOptions ?? []).filter((option) => option.value !== value);
		const hasPlayers = choiceOptions.some((option) => option.playerId);
		onChange({
			...question,
			optionSource: hasPlayers ? question.optionSource ?? "MatchPlayers" : "Manual",
			choiceOptions,
			options: mergeOrderedOptionLabels(
				question.options.filter((option) =>
					option.toLowerCase() !== value.toLowerCase()
					&& option.toLowerCase() !== (removedOption?.label ?? "").toLowerCase()
				),
				choiceOptions
			),
		});
	}

	return (
		<div className="mt-3 space-y-3">
			<div className="rounded-2xl border border-yepset-100 bg-white p-4">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-sm font-black text-slate-900">Options</p>
						<p className="text-xs font-bold text-slate-500">
							Add typed values, player-backed values, or a mix of both.
						</p>
					</div>
					<button
						type="button"
						onClick={() => setIsPlayerModalOpen(true)}
						className="rounded-xl border border-yepset-200 px-3 py-2 text-sm font-black text-yepset-800 hover:bg-yepset-50"
					>
						Add players
					</button>
				</div>
				<label className="mt-3 block text-sm font-bold text-slate-700">
					Options
					<div className="mt-1 flex min-h-28 flex-wrap content-start items-start gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 focus-within:border-yepset-500 focus-within:ring-2 focus-within:ring-yepset-100">
						{orderedOptions.map((option) => {
							const isPlayerOption = Boolean(option.playerId);
							return (
								<span
									key={`${option.playerId ?? "manual"}-${option.value}`}
									className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${
										isPlayerOption
											? "border-yepset-200 bg-yepset-50 text-yepset-800"
											: "border-slate-200 bg-slate-50 text-slate-700"
									}`}
								>
									{option.label}
									<button
										type="button"
										onClick={() => isPlayerOption ? removeChoiceOption(option.value) : removeManualOption(option.value)}
										className={isPlayerOption ? "text-yepset-500 hover:text-red-600" : "text-slate-400 hover:text-red-600"}
										aria-label={`Remove ${option.label}`}
									>
										×
									</button>
								</span>
							);
						})}
						<input
							value={draftOption}
							onBlur={commitDraftOption}
							onChange={(event) => setDraftOption(event.target.value)}
							onKeyDown={handleDraftKeyDown}
							onPaste={handleOptionPaste}
							placeholder={orderedOptions.length ? "Add another option..." : "Type an option and press Enter..."}
							className="min-w-48 flex-1 border-0 bg-transparent px-1 py-1 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
						/>
					</div>
				</label>
			</div>
			<PlayerOptionsModal
				isLoading={isLoadingPlayers && !hasLoadedPlayers}
				error={playerLoadError}
				isOpen={isPlayerModalOpen}
				onClose={() => setIsPlayerModalOpen(false)}
				onConfirm={(selectedPlayers) => {
					addPlayers(selectedPlayers);
					setIsPlayerModalOpen(false);
				}}
				players={players}
				selectedPlayerIds={new Set(playerOptions.map((option) => option.playerId).filter(Boolean) as string[])}
			/>
		</div>
	);
}

function PlayerOptionsModal({
	isOpen,
	players,
	selectedPlayerIds,
	isLoading,
	error,
	onClose,
	onConfirm,
}: {
	isOpen: boolean;
	players: Player[];
	selectedPlayerIds: Set<string>;
	isLoading: boolean;
	error: string;
	onClose: () => void;
	onConfirm: (players: Player[]) => void;
}) {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const availablePlayers = players
		.filter((player) => player.isActive && !selectedPlayerIds.has(player.id))
		.sort((firstPlayer, secondPlayer) => firstPlayer.name.localeCompare(secondPlayer.name));

	useEffect(() => {
		if (isOpen) {
			setSelectedIds(new Set());
		}
	}, [isOpen]);

	function togglePlayer(playerId: string) {
		setSelectedIds((current) => {
			const next = new Set(current);
			if (next.has(playerId)) {
				next.delete(playerId);
			} else {
				next.add(playerId);
			}
			return next;
		});
	}

	return (
		<Modal
			title="Add player options"
			message="Select one, many, or all players to add as ID-backed form options."
			isOpen={isOpen}
			onClose={onClose}
			onConfirm={() => onConfirm(availablePlayers.filter((player) => selectedIds.has(player.id)))}
			confirmText={`Add ${selectedIds.size || ""} player${selectedIds.size === 1 ? "" : "s"}`.trim()}
		>
			<div className="space-y-3">
				{error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}
				{isLoading ? (
					<p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-500">Loading players...</p>
				) : (
					<>
						<div className="flex flex-wrap gap-2">
							<button
								type="button"
								onClick={() => setSelectedIds(new Set(availablePlayers.map((player) => player.id)))}
								className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
							>
								Select all
							</button>
							<button
								type="button"
								onClick={() => setSelectedIds(new Set())}
								className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
							>
								Clear
							</button>
						</div>
						<div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 p-2">
							{availablePlayers.map((player) => (
								<label key={player.id} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
									<input
										type="checkbox"
										checked={selectedIds.has(player.id)}
										onChange={() => togglePlayer(player.id)}
									/>
									<span>{player.name}</span>
								</label>
							))}
							{availablePlayers.length === 0 && (
								<p className="px-3 py-2 text-sm font-bold text-slate-500">No more active players to add.</p>
							)}
						</div>
					</>
				)}
			</div>
		</Modal>
	);
}

function ResultsPanel({ results }: { results: ClubFormResults }) {
	return (
		<section className="mt-6 border-t border-slate-200 pt-5">
			<h3 className="text-lg font-black text-slate-950">Results</h3>
			<p className="mt-1 text-sm text-slate-500">{results.submissionCount} submissions. Respondent identities are not shown.</p>
			<div className="mt-4 space-y-4">
				{results.questions.map((question) => (
					<div key={question.questionId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
						<div className="flex flex-wrap items-start justify-between gap-2">
							<p className="font-black text-slate-950">{question.prompt}</p>
							<span className="text-xs font-bold text-slate-500">{question.responseCount} responses</span>
						</div>
						{question.averageRating !== null && question.averageRating !== undefined && (
							<p className="mt-2 text-sm font-bold text-yepset-700">Average rating: {question.averageRating}</p>
						)}
						{question.options.length > 0 && (
							<div className="mt-3 space-y-2">
								{question.options.map((option) => (
									<div key={option.value}>
										<div className="flex justify-between text-xs font-bold text-slate-600"><span>{option.label || option.value}</span><span>{option.count}</span></div>
										<div className="mt-1 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-yepset-600" style={{ width: `${results.submissionCount ? (option.count / results.submissionCount) * 100 : 0}%` }} /></div>
									</div>
								))}
							</div>
						)}
						{question.textResponses.length > 0 && (
							<div className="mt-3 space-y-2">
								{question.textResponses.map((response, index) => (
									<p key={`${question.questionId}-${index}`} className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700">{response}</p>
								))}
							</div>
						)}
					</div>
				))}
			</div>
		</section>
	);
}

function toEditableForm(form: ClubForm): SaveClubFormRequest {
	return {
		title: form.title,
		description: form.description,
		status: form.status,
		formType: form.formType,
		sourceType: form.sourceType,
		sourceMatchId: form.sourceMatchId ?? null,
		allowAnonymousResponses: form.allowAnonymousResponses,
		allowMultipleSubmissions: form.allowMultipleSubmissions,
		questions: form.questions.length ? form.questions : [createQuestion()],
	};
}

function createQuestion(): ClubFormQuestion {
	return {
		id: crypto.randomUUID(),
		prompt: "",
		type: "ShortText",
		isRequired: true,
		optionSource: "Manual",
		options: [],
		choiceOptions: [],
		minRating: 1,
		maxRating: 5,
	};
}

function resetQuestionForType(question: ClubFormQuestion, type: ClubFormQuestionType): ClubFormQuestion {
	return {
		...question,
		type,
		optionSource: "Manual",
		options: type === "SingleChoice" || type === "MultipleChoice" ? question.options.length ? question.options : ["Option 1", "Option 2"] : [],
		choiceOptions: [],
		minRating: type === "Rating" ? question.minRating : 1,
		maxRating: type === "Rating" ? question.maxRating : 5,
	};
}

function normaliseFormRequest(form: SaveClubFormRequest): SaveClubFormRequest {
	return {
		...form,
		formType: form.formType ?? "Custom",
		title: form.title.trim(),
		description: form.description.trim(),
		questions: form.questions.map((question) => ({
			...question,
			prompt: question.prompt.trim(),
			optionSource: question.optionSource ?? "Manual",
			options: question.options.map((option) => option.trim()).filter(Boolean),
			choiceOptions: question.choiceOptions?.map((option) => ({
				...option,
				value: option.value.trim(),
				label: option.label.trim(),
			})).filter((option) => option.value && option.label) ?? [],
			minRating: Math.max(1, question.minRating),
			maxRating: Math.max(question.minRating, question.maxRating),
		})),
	};
}

function buildInitialAnswers(form: ClubForm): Record<string, DraftAnswer> {
	return Object.fromEntries(
		form.questions.map((question) => [
			question.id,
			{ textValue: "", selectedOptions: [], ratingValue: null, booleanValue: null },
		])
	);
}

function buildSubmissionAnswers(form: ClubForm, answers: Record<string, DraftAnswer>): ClubFormAnswer[] {
	return form.questions.map((question) => ({
		questionId: question.id,
		textValue: answers[question.id]?.textValue ?? "",
		selectedOptions: answers[question.id]?.selectedOptions ?? [],
		ratingValue: answers[question.id]?.ratingValue ?? null,
		booleanValue: answers[question.id]?.booleanValue ?? null,
	}));
}

function getTopAnswer(question: ClubFormQuestionResult) {
	if (question.options.length > 0) {
		const winner = question.options
			.filter((option) => option.count > 0)
			.sort((left, right) => right.count - left.count || (left.label || left.value).localeCompare(right.label || right.value))[0];
		return winner ? winner.label || winner.value : "No responses";
	}

	if (question.averageRating !== null && question.averageRating !== undefined) {
		return String(question.averageRating);
	}

	return question.textResponses[0] ?? "No responses";
}

function getQuestionChoiceOptions(question: ClubFormQuestion): ClubFormQuestionOption[] {
	const choiceOptions = (question.choiceOptions ?? [])
		.map((option) => ({
			...option,
			value: option.value || option.label,
			label: option.label || option.value,
		}))
		.filter((option) => option.value && option.label);
	const choiceOptionsByValue = new Map(
		choiceOptions.flatMap((option) => [
			[option.value.toLowerCase(), option],
			[option.label.toLowerCase(), option],
		])
	);
	const orderedOptions = question.options
		.map((option) => {
			const matchedChoiceOption = choiceOptionsByValue.get(option.toLowerCase());
			return matchedChoiceOption ?? {
				value: option,
				label: option,
			};
		})
		.filter((option, index, options) =>
			options.findIndex((item) => item.value.toLowerCase() === option.value.toLowerCase()) === index
		);
	const orderedValues = new Set(orderedOptions.flatMap((option) => [
		option.value.toLowerCase(),
		option.label.toLowerCase(),
	]));
	const missingChoiceOptions = choiceOptions.filter((option) =>
		!orderedValues.has(option.value.toLowerCase()) && !orderedValues.has(option.label.toLowerCase())
	);

	return [...orderedOptions, ...missingChoiceOptions];
}

function getManualQuestionOptions(question: ClubFormQuestion): string[] {
	const choiceOptionLabels = new Set(
		(question.choiceOptions ?? []).flatMap((option) => [
			option.value.toLowerCase(),
			option.label.toLowerCase(),
		])
	);

	return question.options.filter((option) => !choiceOptionLabels.has(option.toLowerCase()));
}

function mergeOrderedOptionLabels(
	orderedLabels: string[],
	choiceOptions: ClubFormQuestionOption[]
) {
	const choiceOptionLabels = choiceOptions.map((option) => option.label || option.value);

	return [...orderedLabels, ...choiceOptionLabels]
		.map((option) => option.trim())
		.filter(Boolean)
		.filter((option, index, allOptions) =>
			allOptions.findIndex((item) => item.toLowerCase() === option.toLowerCase()) === index
		);
}

function splitOptionInput(value: string) {
	return value
		.split(/[\n,]+/)
		.map((option) => option.trim())
		.filter(Boolean);
}

function getAnonymousSubmissionKey() {
	const existing = localStorage.getItem(anonymousSubmissionStorageKey);
	if (existing) return existing;

	const key = crypto.randomUUID();
	localStorage.setItem(anonymousSubmissionStorageKey, key);
	return key;
}

function formatQuestionType(type: ClubFormQuestionType) {
	return type.replace(/([a-z])([A-Z])/g, "$1 $2").replace("Yes No", "Yes / No");
}

function range(min: number, max: number) {
	return Array.from({ length: Math.max(0, max - min + 1) }, (_, index) => min + index);
}
