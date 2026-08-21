import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { uploadLinkedFile } from "../../services/fileService";
import { socialPublicationsApi } from "../../services/socialPublicationsApi";
import type { SocialDestination, SocialPlatform } from "../../types/integrations";
import { canvasToJpegBlob } from "./socialGraphicCanvas";

type Action = "save" | "publish" | "facebook-draft";

export function SocialPublishModal({ canvas, clubName, suggestedCaption, contentTitle, graphicKind, templateId, editorStateJson, canConfigure, onClose, onPublished }: {
	canvas: HTMLCanvasElement;
	clubName: string;
	suggestedCaption: string;
	contentTitle: string;
	graphicKind: string;
	templateId: string;
	editorStateJson: string;
	canConfigure: boolean;
	onClose: () => void;
	onPublished: (message: string) => void;
}) {
	const [destinations, setDestinations] = useState<SocialDestination[]>([]);
	const [selected, setSelected] = useState<SocialPlatform[]>([]);
	const [title, setTitle] = useState(contentTitle);
	const [facebookCaption, setFacebookCaption] = useState(suggestedCaption);
	const [instagramCaption, setInstagramCaption] = useState(suggestedCaption);
	const [action, setAction] = useState<Action>("save");
	const [isLoading, setIsLoading] = useState(true);
	const [isPublishing, setIsPublishing] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		socialPublicationsApi.getDestinations()
			.then((loaded) => {
				setDestinations(loaded);
				setSelected(loaded.map((item) => item.platform));
			})
			.catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Meta publishing could not be loaded."))
			.finally(() => setIsLoading(false));
	}, []);

	const hasFacebook = destinations.some((item) => item.platform === "Facebook");
	const hasInstagram = destinations.some((item) => item.platform === "Instagram");
	const selectedDestinations = useMemo(() => destinations.filter((item) => selected.includes(item.platform)), [destinations, selected]);

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (selected.length === 0 && action !== "save") return setError("Select at least one destination.");
		if (action === "facebook-draft" && !selected.includes("Facebook")) return setError("Select Facebook to create a Meta draft.");
		let publicationId = "";
		try {
			setIsPublishing(true);
			setError("");
			const publication = await socialPublicationsApi.create({
				title,
				graphicKind,
				templateId,
				editorStateJson,
				publishToFacebook: selected.includes("Facebook"),
				publishToInstagram: selected.includes("Instagram"),
				facebookCaption,
				instagramCaption,
				scheduledForUtc: null,
			});
			publicationId = publication.id;
			const blob = await canvasToJpegBlob(canvas);
			const file = new File([blob], `${filenamePart(clubName)}-${publication.id}.jpg`, { type: "image/jpeg" });
			const uploaded = await uploadLinkedFile({ file, linkedEntityType: "SocialPublication", linkedEntityId: publication.id, visibility: "AdminAndCoach" });
			await socialPublicationsApi.attachMedia(publication.id, uploaded.id);

			if (action === "publish") {
				await socialPublicationsApi.queue(publication.id, "PublishNow");
				onPublished(`Post queued for immediate publishing to ${selectedDestinations.map((item) => item.platform).join(" and ")}.`);
			} else if (action === "facebook-draft") {
				await socialPublicationsApi.queue(publication.id, "FacebookDraft");
				onPublished(selected.includes("Instagram")
					? "Facebook draft queued. The Instagram version is safely retained in Yepset because Meta does not support Instagram drafts through its API."
					: "Facebook draft queued for Meta. It will remain unpublished.");
			} else {
				onPublished("Content saved to your Yepset content library.");
			}
			onClose();
		} catch (publishError) {
			if (publicationId) void socialPublicationsApi.cancel(publicationId).catch(() => undefined);
			setError(publishError instanceof Error ? publishError.message : "The content could not be saved.");
		} finally {
			setIsPublishing(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/55 sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Save or publish content">
			<div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
				<header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
					<div><p className="text-xs font-black uppercase tracking-wider text-yepset-700">Social Media Studio</p><h2 className="text-xl font-black text-slate-950">Save or publish</h2></div>
					<button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-xl text-slate-500 hover:bg-slate-100" aria-label="Close">×</button>
				</header>
				<form onSubmit={submit} className="p-5 sm:p-6">
					{error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">{error}</div>}
					<label className="block text-sm font-black text-slate-700">Content title<input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-semibold" /></label>
					{isLoading ? <p className="py-8 text-center text-sm font-semibold text-slate-500">Loading club destinations…</p> : destinations.length === 0 ? (
						<div className="mt-4"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center"><h3 className="font-black text-amber-950">No Meta destination is enabled for this club</h3><p className="mt-2 text-sm text-amber-800">You can still save this content in Yepset and connect Meta later.</p>{canConfigure && <Link to="/organization/integrations" className="btn-secondary mt-4">Configure integrations</Link>}</div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" disabled={isPublishing} className="btn-primary disabled:opacity-50">{isPublishing ? "Saving content…" : "Save content"}</button></div></div>
					) : <>
						<fieldset className="mt-5"><legend className="text-sm font-black text-slate-900">Destinations</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{destinations.map((destination) => <label key={destination.platform} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><input type="checkbox" checked={selected.includes(destination.platform)} onChange={() => setSelected((current) => current.includes(destination.platform) ? current.filter((item) => item !== destination.platform) : [...current, destination.platform])} className="h-4 w-4 accent-yepset-700" /><span><span className="block text-sm font-black text-slate-900">{destination.platform}</span><span className="block text-xs font-semibold text-slate-500">{destination.username ? `@${destination.username}` : destination.name}</span></span></label>)}</div></fieldset>
						{hasFacebook && <CaptionField label="Facebook caption" value={facebookCaption} maxLength={63206} disabled={!selected.includes("Facebook")} onChange={setFacebookCaption} />}
						{hasInstagram && <CaptionField label="Instagram caption" value={instagramCaption} maxLength={2200} disabled={!selected.includes("Instagram")} onChange={setInstagramCaption} />}
						<div className="mt-5 grid gap-2 sm:grid-cols-3">
							<ActionChoice value="save" selected={action} title="Save in Yepset" detail="Keep unpublished in your content library." onSelect={setAction} />
							<ActionChoice value="facebook-draft" selected={action} title="Facebook draft" detail="Send an unpublished draft to Meta. Instagram stays in Yepset." onSelect={setAction} />
							<ActionChoice value="publish" selected={action} title="Publish now" detail="Publish immediately to selected channels." onSelect={setAction} />
						</div>
						<div className="mt-3 rounded-xl bg-sky-50 p-3 text-xs font-semibold leading-5 text-sky-900">Meta does not provide a persistent Instagram draft API. Yepset will never silently publish the Instagram version when Facebook draft is selected.</div>
						<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" disabled={isPublishing || (selected.length === 0 && action !== "save")} className="btn-primary disabled:opacity-50">{isPublishing ? "Preparing content…" : action === "save" ? "Save content" : action === "facebook-draft" ? "Create Facebook draft" : "Publish now"}</button></div>
					</>}
				</form>
			</div>
		</div>
	);
}

function ActionChoice({ value, selected, title, detail, onSelect }: { value: Action; selected: Action; title: string; detail: string; onSelect: (action: Action) => void }) {
	return <button type="button" onClick={() => onSelect(value)} className={`rounded-xl border p-3 text-left ${selected === value ? "border-yepset-700 bg-yepset-50 ring-2 ring-yepset-100" : "border-slate-200 hover:bg-slate-50"}`}><span className="block text-sm font-black text-slate-900">{title}</span><span className="mt-1 block text-xs font-semibold leading-4 text-slate-500">{detail}</span></button>;
}

function CaptionField({ label, value, maxLength, disabled, onChange }: { label: string; value: string; maxLength: number; disabled: boolean; onChange: (value: string) => void }) {
	return <label className={`mt-5 block text-sm font-black ${disabled ? "text-slate-400" : "text-slate-700"}`}>{label}<textarea value={value} maxLength={maxLength} disabled={disabled} rows={4} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-slate-900 disabled:bg-slate-100" /><span className="mt-1 block text-right text-xs font-semibold text-slate-400">{value.length.toLocaleString()} / {maxLength.toLocaleString()}</span></label>;
}

function filenamePart(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "club"; }
