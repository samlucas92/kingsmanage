import { useEffect, useMemo, useState } from "react";

import { postsApi } from "../../../../services/postsApi";
import type { Match } from "../../../../stores/match";
import type { Player } from "../../../../stores/players";
import type {
	ClubPostTemplate,
	CreateClubPostRequest,
	SaveClubPostTemplateRequest,
} from "../../../../types/posts";
import { applyPostTemplate, buildGeneratedRichPostBody, buildTemplateValues } from "../../../../utils/postTemplate";
import RichTextEditor from "../../../../components/rich-text/RichTextEditor";
import RichTextContent from "../../../../components/rich-text/RichTextContent";
import { isRichTextEmpty } from "../../../../utils/richText";

const defaultTemplate: SaveClubPostTemplateRequest = {
	name: "Matchday squad",
	titleTemplate: "{{team}} vs {{opponent}}",
	bodyTemplate:
		"{{competition}}\n\n{{date}}\n{{venue}} · {{location}}\n\nSquad (random order):\n{{squad}}\n\n{{directions}}",
	isPinned: false,
};

type Props = {
	isOpen: boolean;
	match: Match;
	players: Player[];
	teamName: string;
	onClose: () => void;
	onPublish: (request: CreateClubPostRequest) => Promise<void>;
};

export function GeneratePostModal({
	isOpen,
	match,
	players,
	teamName,
	onClose,
	onPublish,
}: Props) {
	const [templates, setTemplates] = useState<ClubPostTemplate[]>([]);
	const [selectedId, setSelectedId] = useState("");
	const [draft, setDraft] = useState(defaultTemplate);
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [isEditingTemplate, setIsEditingTemplate] = useState(false);
	const [isBusy, setIsBusy] = useState(false);
	const [error, setError] = useState("");
	const [editorRevision, setEditorRevision] = useState(0);
	const [templateDraftId, setTemplateDraftId] = useState(() => crypto.randomUUID());
	const [postDraftId] = useState(() => crypto.randomUUID());
	const selectedTemplate = templates.find((template) => template.id === selectedId);
	const values = useMemo(
		() => buildTemplateValues(match, players, teamName),
		[match, players, teamName]
	);

	useEffect(() => {
		if (!isOpen) return;
		void postsApi.getTemplates().then((items) => {
			setError("");
			setTemplates(items);
			if (items[0]) {
				setSelectedId(items[0].id);
				const generated = applyPostTemplate(items[0], values);
				setTitle(generated.title);
				setBody(buildGeneratedRichPostBody(generated.body, values));
				setEditorRevision((revision) => revision + 1);
			} else {
				setDraft(defaultTemplate);
				setIsEditingTemplate(true);
			}
		}).catch((reason: unknown) => {
			setError(reason instanceof Error ? reason.message : "Could not load post templates.");
		});
	}, [isOpen, values]);

	if (!isOpen) return null;

	function generate(template = selectedTemplate) {
		if (!template) return;
		const generatedValues = buildTemplateValues(match, players, teamName);
		const generated = applyPostTemplate(
			template,
			generatedValues
		);
		setTitle(generated.title);
		setBody(buildGeneratedRichPostBody(generated.body, generatedValues));
		setEditorRevision((revision) => revision + 1);
	}

	async function saveTemplate() {
		if (!draft.name.trim() || !draft.titleTemplate.trim() || !draft.bodyTemplate.trim()) {
			setError("Complete the template name, title and content.");
			return;
		}
		setIsBusy(true);
		try {
			const saved = selectedTemplate
				? await postsApi.updateTemplate(selectedTemplate.id, draft)
				: await postsApi.createTemplate(draft);
			setTemplates((items) => [
				...items.filter((item) => item.id !== saved.id),
				saved,
			].sort((a, b) => a.name.localeCompare(b.name)));
			setSelectedId(saved.id);
			setIsEditingTemplate(false);
			generate(saved);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Could not save template.");
		} finally {
			setIsBusy(false);
		}
	}

	async function deleteTemplate() {
		if (!selectedTemplate) return;
		setIsBusy(true);
		try {
			await postsApi.deleteTemplate(selectedTemplate.id);
			const remaining = templates.filter((item) => item.id !== selectedTemplate.id);
			setTemplates(remaining);
			setSelectedId(remaining[0]?.id ?? "");
			if (remaining[0]) generate(remaining[0]);
		} finally {
			setIsBusy(false);
		}
	}

	async function publish() {
		if (!title.trim() || isRichTextEmpty(body)) {
			setError("The generated post needs a title and content.");
			return;
		}
		setIsBusy(true);
		try {
			await onPublish({
				type: "MatchInfo",
				title: title.trim(),
				body: body.trim(),
				isPinned: selectedTemplate?.isPinned ?? false,
			});
			onClose();
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Could not publish post.");
		} finally {
			setIsBusy(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-950/50 p-2 sm:p-6">
			<div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
				<header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 sm:p-5">
					<div className="min-w-0">
						<p className="text-xs font-bold uppercase tracking-wide text-blue-700">Team selection</p>
						<h2 className="text-2xl font-black leading-tight text-slate-950 sm:text-3xl">Generate matchday post</h2>
						<p className="mt-1 text-sm text-slate-500">Squad names are shuffled each time, hiding lineup order.</p>
					</div>
					<button type="button" onClick={onClose} className="shrink-0 rounded-xl border px-3 py-2 text-sm font-bold">Close</button>
				</header>

				<div className="grid min-w-0 gap-5 p-4 sm:p-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
					<aside className="min-w-0 space-y-3">
						<label className="block text-sm font-bold text-slate-700">Template</label>
						<select
							value={selectedId}
							onChange={(event) => {
								const template = templates.find((item) => item.id === event.target.value);
								setSelectedId(event.target.value);
								setIsEditingTemplate(false);
								generate(template);
							}}
							className="w-full rounded-xl border border-slate-300 p-2"
						>
							<option value="">Select template</option>
							{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
						</select>
						<div className="flex flex-wrap gap-2">
							<button type="button" onClick={() => {
								setSelectedId("");
								setDraft(defaultTemplate);
								setTemplateDraftId(crypto.randomUUID());
								setIsEditingTemplate(true);
							}} className="rounded-lg border px-3 py-2 text-xs font-bold">New</button>
							<button type="button" disabled={!selectedTemplate} onClick={() => {
								if (!selectedTemplate) return;
								setDraft({
									name: selectedTemplate.name,
									titleTemplate: selectedTemplate.titleTemplate,
									bodyTemplate: selectedTemplate.bodyTemplate,
									isPinned: selectedTemplate.isPinned,
								});
								setIsEditingTemplate(true);
							}} className="rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-40">Edit</button>
							<button type="button" disabled={!selectedTemplate || isBusy} onClick={() => void deleteTemplate()} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-40">Delete</button>
						</div>
						<button type="button" disabled={!selectedTemplate} onClick={() => generate()} className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-40">
							Shuffle squad again
						</button>
						<p className="break-words text-xs leading-5 text-slate-500">Available: {"{{team}}, {{opponent}}, {{date}}, {{venue}}, {{location}}, {{locationUrl}}, {{competition}}, {{squad}}, {{directions}}, {{directionsUrl}}"}</p>
					</aside>

					<section className="min-w-0 space-y-4">
						{error && <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
						{isEditingTemplate ? (
							<div className="min-w-0 space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-3 sm:p-4">
								<input value={draft.name} onChange={(event) => setDraft({...draft, name: event.target.value})} placeholder="Template name" className="w-full rounded-lg border p-2" />
								<input value={draft.titleTemplate} onChange={(event) => setDraft({...draft, titleTemplate: event.target.value})} placeholder="Title template" className="w-full rounded-lg border p-2" />
								<RichTextEditor
									value={draft.bodyTemplate}
									onChange={(bodyTemplate) => setDraft({ ...draft, bodyTemplate })}
									placeholder="Template content"
									imageOwner={{
										linkedEntityType: "RichTextDraft",
										linkedEntityId: templateDraftId,
									}}
								/>
								<label className="flex gap-2 text-sm font-semibold"><input type="checkbox" checked={draft.isPinned} onChange={(event) => setDraft({...draft, isPinned: event.target.checked})} /> Pin generated posts</label>
								<div className="flex flex-wrap gap-2">
									<button type="button" disabled={isBusy} onClick={() => void saveTemplate()} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white">Save template</button>
									{templates.length > 0 && <button type="button" onClick={() => setIsEditingTemplate(false)} className="rounded-lg border px-3 py-2 text-sm font-bold">Cancel</button>}
								</div>
							</div>
						) : (
							<>
								<label className="block text-sm font-bold">Post title<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label>
								<div className="block min-w-0 text-sm font-bold">Post content
									<div className="mt-2 min-w-0 overflow-hidden font-normal">
										<RichTextEditor
											key={editorRevision}
											value={body}
											onChange={setBody}
											placeholder="Matchday details"
											imageOwner={{
												linkedEntityType: "RichTextDraft",
												linkedEntityId: postDraftId,
											}}
										/>
									</div>
								</div>
								<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
									<p className="text-xs font-bold uppercase text-slate-500">Preview</p>
									<h3 className="mt-2 text-xl font-black">{title}</h3>
									<RichTextContent value={body} className="mt-3 text-sm leading-6 text-slate-700" />
								</div>
								<div className="flex justify-end">
									<button type="button" disabled={isBusy || !selectedTemplate} onClick={() => void publish()} className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{isBusy ? "Publishing..." : "Publish post"}</button>
								</div>
							</>
						)}
					</section>
				</div>
			</div>
		</div>
	);
}
