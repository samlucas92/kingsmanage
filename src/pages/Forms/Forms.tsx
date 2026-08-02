import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import { formsApi } from "../../services/formsApi";
import { useAuthStore } from "../../stores/auth";
import type {
	ClubForm,
	ClubFormAnswer,
	ClubFormQuestion,
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

const anonymousSubmissionStorageKey = "yepset.forms.anonymousSubmissionKey";

export default function Forms() {
	const { goCode } = useParams<{ goCode: string }>();
	const currentUser = useAuthStore((state) => state.currentUser);
	const isPublicForm = Boolean(goCode);
	const canManageForms = !isPublicForm && (currentUser?.role === "Admin" || currentUser?.role === "Coach");

	const [forms, setForms] = useState<ClubForm[]>([]);
	const [selectedFormId, setSelectedFormId] = useState("");
	const [selectedForm, setSelectedForm] = useState<ClubForm | null>(null);
	const [results, setResults] = useState<ClubFormResults | null>(null);
	const [answers, setAnswers] = useState<Record<string, DraftAnswer>>({});
	const [editingForm, setEditingForm] = useState<SaveClubFormRequest | null>(null);
	const [editingFormId, setEditingFormId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");
	const [submitMessage, setSubmitMessage] = useState("");

	useEffect(() => {
		if (goCode) {
			void loadPublicForm(goCode);
			return;
		}

		void loadForms();
	}, [goCode]);

	useEffect(() => {
		if (isPublicForm) {
			return;
		}

		if (!selectedFormId) {
			setSelectedForm(null);
			setResults(null);
			return;
		}

		void loadSelectedForm(selectedFormId);
	}, [selectedFormId]);

	const selectedFormFromList = useMemo(
		() => forms.find((form) => form.id === selectedFormId) ?? null,
		[forms, selectedFormId]
	);
	const form = selectedForm ?? selectedFormFromList;

	const canSubmitSelectedForm = form?.status === "Open" &&
		(!form.hasSubmitted || form.allowMultipleSubmissions);

	async function loadPublicForm(code: string) {
		setIsLoading(true);
		setError("");
		setSubmitMessage("");

		try {
			const loadedForm = await formsApi.getPublicForm(code, getAnonymousSubmissionKey());
			setSelectedForm(loadedForm);
			setAnswers(buildInitialAnswers(loadedForm));
		} catch (error) {
			setSelectedForm(null);
			setError(error instanceof Error ? error.message : "Failed to load form.");
		} finally {
			setIsLoading(false);
		}
	}

	async function loadForms() {
		setIsLoading(true);
		setError("");

		try {
			const loadedForms = await formsApi.getForms();
			setForms(loadedForms);
			setSelectedFormId((current) =>
				current && loadedForms.some((form) => form.id === current)
					? current
					: loadedForms[0]?.id ?? ""
			);
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to load forms.");
		} finally {
			setIsLoading(false);
		}
	}

	async function loadSelectedForm(formId: string) {
		setError("");
		setSubmitMessage("");

		try {
			const loadedForm = await formsApi.getForm(formId);
			setSelectedForm(loadedForm);
			setAnswers(buildInitialAnswers(loadedForm));
			if (canManageForms) {
				setResults(await formsApi.getResults(formId));
			}
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to load form.");
		}
	}

	function openCreateForm() {
		setEditingFormId(null);
		setEditingForm({
			title: "",
			description: "",
			status: "Draft",
			allowAnonymousResponses: true,
			allowMultipleSubmissions: false,
			questions: [createQuestion()],
		});
	}

	function openEditForm(formToEdit: ClubForm) {
		setEditingFormId(formToEdit.id);
		setEditingForm({
			title: formToEdit.title,
			description: formToEdit.description,
			status: formToEdit.status,
			allowAnonymousResponses: formToEdit.allowAnonymousResponses,
			allowMultipleSubmissions: formToEdit.allowMultipleSubmissions,
			questions: formToEdit.questions.length ? formToEdit.questions : [createQuestion()],
		});
	}

	async function saveEditingForm(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!editingForm) return;

		setIsSaving(true);
		setError("");

		try {
			const request = normaliseFormRequest(editingForm);
			const saved = editingFormId
				? await formsApi.updateForm(editingFormId, request)
				: await formsApi.createForm(request);
			setEditingForm(null);
			setEditingFormId(null);
			await loadForms();
			setSelectedFormId(saved.id);
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to save form.");
		} finally {
			setIsSaving(false);
		}
	}

	async function deleteForm(formId: string) {
		if (!window.confirm("Delete this form and all anonymous submissions?")) {
			return;
		}

		setError("");

		try {
			await formsApi.deleteForm(formId);
			await loadForms();
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to delete form.");
		}
	}

	async function shareForm(formToShare: ClubForm) {
		const url = `${window.location.origin}/go/${formToShare.goCode}`;

		try {
			await navigator.clipboard.writeText(url);
			setSubmitMessage("Share link copied to clipboard.");
		} catch {
			window.prompt("Copy form link", url);
		}
	}

	async function submitForm(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!form || !canSubmitSelectedForm) {
			return;
		}

		setIsSaving(true);
		setError("");
		setSubmitMessage("");

		try {
			const submitted = isPublicForm && goCode
				? await formsApi.submitPublicForm(goCode, {
					anonymousSubmissionKey: getAnonymousSubmissionKey(),
					answers: buildSubmissionAnswers(form, answers),
				})
				: await formsApi.submitForm(form.id, {
				answers: buildSubmissionAnswers(form, answers),
			});
			setSelectedForm(submitted);
			setForms((current) => current.map((item) => item.id === submitted.id ? submitted : item));
			setSubmitMessage("Thanks — your anonymous response has been submitted.");
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

	const content = (
		<div className="space-y-4 lg:space-y-6">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<h1 className="text-2xl font-black tracking-[-.03em] text-slate-950">Forms</h1>
					<p className="mt-1 text-sm text-slate-600">
						{isPublicForm
							? "Complete the form below."
							: "Create club forms with anonymous/public response options."}
					</p>
				</div>

				{canManageForms && (
					<button type="button" onClick={openCreateForm} className="btn-primary">
						New form
					</button>
				)}
			</div>

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
					{error}
				</div>
			)}

			<div className={isPublicForm ? "grid gap-4" : "grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]"}>
				{!isPublicForm && <section className="surface-card p-4">
					<h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Available forms</h2>

					{isLoading ? (
						<p className="mt-4 text-sm text-slate-500">Loading forms...</p>
					) : forms.length === 0 ? (
						<p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
							No forms are available yet.
						</p>
					) : (
						<div className="mt-4 space-y-2">
							{forms.map((formItem) => (
								<button
									key={formItem.id}
									type="button"
									onClick={() => setSelectedFormId(formItem.id)}
									className={`w-full rounded-xl border px-3 py-3 text-left transition ${
										selectedFormId === formItem.id
											? "border-yepset-500 bg-yepset-50"
											: "border-slate-200 bg-white hover:bg-slate-50"
									}`}
								>
									<div className="flex items-start justify-between gap-2">
										<p className="font-black text-slate-950">{formItem.title}</p>
										<StatusPill status={formItem.status} />
									</div>
									<p className="mt-1 text-xs text-slate-500">
										{formItem.hasSubmitted ? "Submitted" : "Not submitted"}
										{canManageForms ? ` · ${formItem.submissionCount} responses` : ""}
									</p>
								</button>
							))}
						</div>
					)}
				</section>}

				<section className="surface-card min-w-0 p-4 lg:p-6">
					{isLoading && isPublicForm ? (
						<p className="text-sm text-slate-500">Loading form...</p>
					) : form ? (
						<div className="space-y-6">
							<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
								<div>
									<div className="flex flex-wrap items-center gap-2">
										<StatusPill status={form.status} />
										<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
											{form.allowAnonymousResponses ? "Anonymous allowed" : "Login required"}
										</span>
										{form.allowMultipleSubmissions && (
											<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
												Multiple submissions allowed
											</span>
										)}
									</div>
									<h2 className="mt-3 text-2xl font-black tracking-[-.03em] text-slate-950">{form.title}</h2>
									{form.description && <p className="mt-2 text-sm leading-6 text-slate-600">{form.description}</p>}
									<p className="mt-2 text-xs text-slate-400">Updated {formatDisplayDateTime(form.updatedAt)}</p>
								</div>

								{canManageForms && (
									<div className="flex flex-wrap gap-2">
										<button type="button" onClick={() => shareForm(form)} className="btn-secondary">Share</button>
										<button type="button" onClick={() => openEditForm(form)} className="btn-secondary">Edit</button>
										<button type="button" onClick={() => deleteForm(form.id)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50">Delete</button>
									</div>
								)}
							</div>

							{submitMessage && (
								<div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
									{submitMessage}
								</div>
							)}

							{form.hasSubmitted && !form.allowMultipleSubmissions ? (
								<div className="rounded-xl border border-yepset-100 bg-yepset-50 px-4 py-3 text-sm font-semibold text-yepset-900">
									You have already submitted this form. Your answers are anonymous in the results.
								</div>
							) : form.status !== "Open" ? (
								<div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
									This form is not open for responses.
								</div>
							) : (
								<form onSubmit={submitForm} className="space-y-4">
									{form.questions.map((question) => (
										<FormQuestionInput
											key={question.id}
											question={question}
											value={answers[question.id]}
											onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))}
										/>
									))}
									<button type="submit" disabled={isSaving} className="btn-primary disabled:cursor-not-allowed disabled:bg-slate-300">
										Submit anonymous response
									</button>
								</form>
							)}

							{canManageForms && results && (
								<ResultsPanel results={results} />
							)}
						</div>
					) : (
						<div className="space-y-3">
							<p className="text-sm text-slate-500">{isPublicForm ? "This form could not be loaded." : "Select a form to view it."}</p>
							{isPublicForm && (
								<Link to="/login" className="btn-primary inline-flex">
									Sign in
								</Link>
							)}
						</div>
					)}
				</section>
			</div>

			{editingForm && (
				<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 px-3 py-6">
					<form onSubmit={saveEditingForm} className="mx-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
						<div className="border-b border-slate-200 px-5 py-4">
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="text-xs font-black uppercase tracking-wide text-yepset-700">Anonymous form</p>
									<h2 className="mt-1 text-xl font-black text-slate-950">{editingFormId ? "Edit form" : "New form"}</h2>
								</div>
								<button type="button" onClick={() => setEditingForm(null)} className="btn-secondary">Close</button>
							</div>
						</div>

						<div className="space-y-4 px-5 py-5">
							<label className="block text-sm font-bold text-slate-700">
								Title
								<input value={editingForm.title} onChange={(event) => setEditingForm({ ...editingForm, title: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" required />
							</label>

							<label className="block text-sm font-bold text-slate-700">
								Description
								<textarea value={editingForm.description} onChange={(event) => setEditingForm({ ...editingForm, description: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" rows={3} />
							</label>

							<label className="block text-sm font-bold text-slate-700">
								Status
								<select value={editingForm.status} onChange={(event) => setEditingForm({ ...editingForm, status: event.target.value as ClubFormStatus })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2">
									<option value="Draft">Draft</option>
									<option value="Open">Open</option>
									<option value="Closed">Closed</option>
								</select>
							</label>

							<div className="grid gap-3 sm:grid-cols-2">
								<label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
									<input type="checkbox" checked={editingForm.allowAnonymousResponses} onChange={(event) => setEditingForm({ ...editingForm, allowAnonymousResponses: event.target.checked })} className="mt-1" />
									<span>
										Allow anonymous responses
										<span className="mt-1 block text-xs font-medium text-slate-500">If off, shared form links require sign in.</span>
									</span>
								</label>
								<label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
									<input type="checkbox" checked={editingForm.allowMultipleSubmissions} onChange={(event) => setEditingForm({ ...editingForm, allowMultipleSubmissions: event.target.checked })} className="mt-1" />
									<span>
										Allow multiple submissions
										<span className="mt-1 block text-xs font-medium text-slate-500">If off, each signed-in user/browser can answer once.</span>
									</span>
								</label>
							</div>

							<div className="space-y-3">
								<div className="flex items-center justify-between gap-3">
									<h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Questions</h3>
									<button type="button" onClick={() => setEditingForm({ ...editingForm, questions: [...editingForm.questions, createQuestion()] })} className="btn-secondary">Add question</button>
								</div>

								{editingForm.questions.map((question, index) => (
									<QuestionEditor
										key={question.id}
										question={question}
										index={index}
										onChange={(updated) => updateEditingQuestion(index, updated)}
										onRemove={() => setEditingForm({ ...editingForm, questions: editingForm.questions.filter((_, itemIndex) => itemIndex !== index) })}
										canRemove={editingForm.questions.length > 1}
									/>
								))}
							</div>
						</div>

						<div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
							<button type="button" onClick={() => setEditingForm(null)} className="btn-secondary">Cancel</button>
							<button type="submit" disabled={isSaving} className="btn-primary disabled:cursor-not-allowed disabled:bg-slate-300">
								{isSaving ? "Saving..." : "Save form"}
							</button>
						</div>
					</form>
				</div>
			)}
		</div>
	);

	if (isPublicForm) {
		return (
			<div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(21,128,113,.16),transparent_32%),#f8fafc] px-4 py-8 text-slate-900">
				<div className="mx-auto max-w-3xl">
					<div className="mb-5 rounded-2xl bg-yepset-700 px-5 py-4 text-white shadow-lg">
						<p className="text-xs font-black uppercase tracking-[.25em] text-kick-300">Yepset</p>
						<h1 className="mt-1 text-xl font-black">Club form</h1>
					</div>
					{content}
				</div>
			</div>
		);
	}

	return content;
}

type DraftAnswer = {
	textValue: string;
	selectedOptions: string[];
	ratingValue?: number | null;
	booleanValue?: boolean | null;
};

function StatusPill({ status }: { status: ClubFormStatus }) {
	const className =
		status === "Open"
			? "bg-green-100 text-green-800"
			: status === "Closed"
				? "bg-red-100 text-red-800"
				: "bg-slate-100 text-slate-700";

	return <span className={`rounded-full px-2.5 py-1 text-xs font-black ${className}`}>{status}</span>;
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
					{question.options.map((option) => (
						<label key={option} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
							<input type="radio" name={question.id} checked={answer.selectedOptions[0] === option} onChange={() => onChange({ ...answer, selectedOptions: [option] })} required={question.isRequired} />
							{option}
						</label>
					))}
				</div>
			)}
			{question.type === "MultipleChoice" && (
				<div className="mt-3 space-y-2">
					{question.options.map((option) => (
						<label key={option} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
							<input
								type="checkbox"
								checked={answer.selectedOptions.includes(option)}
								onChange={(event) => onChange({
									...answer,
									selectedOptions: event.target.checked
										? [...answer.selectedOptions, option]
										: answer.selectedOptions.filter((item) => item !== option),
								})}
							/>
							{option}
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
				<label className="mt-3 block text-sm font-bold text-slate-700">
					Options, one per line
					<textarea value={question.options.join("\n")} onChange={(event) => onChange({ ...question, options: event.target.value.split("\n") })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" rows={4} />
				</label>
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

function ResultsPanel({ results }: { results: ClubFormResults }) {
	return (
		<section className="border-t border-slate-200 pt-5">
			<h3 className="text-lg font-black text-slate-950">Anonymous results</h3>
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
										<div className="flex justify-between text-xs font-bold text-slate-600"><span>{option.value}</span><span>{option.count}</span></div>
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

function createQuestion(): ClubFormQuestion {
	return {
		id: crypto.randomUUID(),
		prompt: "",
		type: "ShortText",
		isRequired: true,
		options: [],
		minRating: 1,
		maxRating: 5,
	};
}

function resetQuestionForType(question: ClubFormQuestion, type: ClubFormQuestionType): ClubFormQuestion {
	return {
		...question,
		type,
		options: type === "SingleChoice" || type === "MultipleChoice" ? question.options.length ? question.options : ["Option 1", "Option 2"] : [],
		minRating: type === "Rating" ? question.minRating : 1,
		maxRating: type === "Rating" ? question.maxRating : 5,
	};
}

function normaliseFormRequest(form: SaveClubFormRequest): SaveClubFormRequest {
	return {
		...form,
		title: form.title.trim(),
		description: form.description.trim(),
		questions: form.questions.map((question) => ({
			...question,
			prompt: question.prompt.trim(),
			options: question.options.map((option) => option.trim()).filter(Boolean),
			minRating: Math.max(1, question.minRating),
			maxRating: Math.max(question.minRating, question.maxRating),
		})),
	};
}

function buildInitialAnswers(form: ClubForm): Record<string, DraftAnswer> {
	return Object.fromEntries(
		form.questions.map((question) => [
			question.id,
			{
				textValue: "",
				selectedOptions: [],
				ratingValue: null,
				booleanValue: null,
			},
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

function getAnonymousSubmissionKey() {
	const existing = localStorage.getItem(anonymousSubmissionStorageKey);
	if (existing) {
		return existing;
	}

	const key = crypto.randomUUID();
	localStorage.setItem(anonymousSubmissionStorageKey, key);
	return key;
}

function formatQuestionType(type: ClubFormQuestionType) {
	return type
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace("Yes No", "Yes / No");
}

function range(min: number, max: number) {
	return Array.from({ length: Math.max(0, max - min + 1) }, (_, index) => min + index);
}
