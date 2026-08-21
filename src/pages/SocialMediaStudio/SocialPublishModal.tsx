import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { uploadLinkedFile } from "../../services/fileService";
import { socialPublicationsApi } from "../../services/socialPublicationsApi";
import type { SocialDestination, SocialPlatform, SocialPublication } from "../../types/integrations";
import { canvasToJpegBlob } from "./socialGraphicCanvas";

export function SocialPublishModal({ canvas, clubName, suggestedCaption, canConfigure, onClose, onPublished }: {
	canvas: HTMLCanvasElement;
	clubName: string;
	suggestedCaption: string;
	canConfigure: boolean;
	onClose: () => void;
	onPublished: (message: string) => void;
}) {
	const [destinations, setDestinations] = useState<SocialDestination[]>([]);
	const [history, setHistory] = useState<SocialPublication[]>([]);
	const [selected, setSelected] = useState<SocialPlatform[]>([]);
	const [facebookCaption, setFacebookCaption] = useState(suggestedCaption);
	const [instagramCaption, setInstagramCaption] = useState(suggestedCaption);
	const [isScheduled, setIsScheduled] = useState(false);
	const [scheduledFor, setScheduledFor] = useState(defaultScheduleValue());
	const [minimumSchedule] = useState(() => toLocalDateTime(new Date(Date.now() + 60_000)));
	const [isLoading, setIsLoading] = useState(true);
	const [isPublishing, setIsPublishing] = useState(false);
	const [error, setError] = useState("");
	const [tab, setTab] = useState<"publish" | "history">("publish");

	useEffect(() => {
		Promise.all([socialPublicationsApi.getDestinations(), socialPublicationsApi.getHistory(20)])
			.then(([loadedDestinations, loadedHistory]) => {
				setDestinations(loadedDestinations);
				setSelected(loadedDestinations.map((item) => item.platform));
				setHistory(loadedHistory);
			})
			.catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Meta publishing could not be loaded."))
			.finally(() => setIsLoading(false));
	}, []);

	const hasFacebook = destinations.some((item) => item.platform === "Facebook");
	const hasInstagram = destinations.some((item) => item.platform === "Instagram");
	const selectedDestinations = useMemo(() => destinations.filter((item) => selected.includes(item.platform)), [destinations, selected]);

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (selected.length === 0) return setError("Select at least one destination.");
		if (isScheduled && Date.parse(scheduledFor) <= Date.now()) return setError("Choose a future date and time.");
		let publicationId = "";
		try {
			setIsPublishing(true);
			setError("");
			const publication = await socialPublicationsApi.create({
				publishToFacebook: selected.includes("Facebook"),
				publishToInstagram: selected.includes("Instagram"),
				facebookCaption,
				instagramCaption,
				scheduledForUtc: isScheduled ? new Date(scheduledFor).toISOString() : null,
			});
			publicationId = publication.id;
			const blob = await canvasToJpegBlob(canvas);
			const file = new File([blob], `${filenamePart(clubName)}-${publication.id}.jpg`, { type: "image/jpeg" });
			const uploaded = await uploadLinkedFile({
				file,
				linkedEntityType: "SocialPublication",
				linkedEntityId: publication.id,
				visibility: "AdminAndCoach",
			});
			const queued = await socialPublicationsApi.attachMedia(publication.id, uploaded.id);
			onPublished(isScheduled
				? `Post scheduled for ${new Date(queued.scheduledForUtc!).toLocaleString()}.`
				: `Post queued for ${selectedDestinations.map((item) => item.platform).join(" and ")}.`);
			onClose();
		} catch (publishError) {
			if (publicationId) void socialPublicationsApi.cancel(publicationId).catch(() => undefined);
			setError(publishError instanceof Error ? publishError.message : "The post could not be queued.");
		} finally {
			setIsPublishing(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/55 sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Publish to Meta">
			<div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
				<header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
					<div><p className="text-xs font-black uppercase tracking-wider text-yepset-700">Social Media Studio</p><h2 className="text-xl font-black text-slate-950">Publish to Meta</h2></div>
					<button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-xl text-slate-500 hover:bg-slate-100" aria-label="Close">×</button>
				</header>
				<div className="grid grid-cols-2 border-b border-slate-200 p-1.5">
					<button type="button" onClick={() => setTab("publish")} className={`rounded-xl px-3 py-2 text-sm font-black ${tab === "publish" ? "bg-yepset-950 text-white" : "text-slate-600"}`}>New post</button>
					<button type="button" onClick={() => setTab("history")} className={`rounded-xl px-3 py-2 text-sm font-black ${tab === "history" ? "bg-yepset-950 text-white" : "text-slate-600"}`}>Publication history</button>
				</div>

				{tab === "publish" ? (
					<form onSubmit={submit} className="p-5 sm:p-6">
						{error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">{error}</div>}
						{isLoading ? <p className="py-8 text-center text-sm font-semibold text-slate-500">Loading club destinations…</p> : destinations.length === 0 ? (
							<div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center"><h3 className="font-black text-amber-950">No Meta destination is enabled for this club</h3><p className="mt-2 text-sm text-amber-800">An organisation administrator must connect Meta and map this club to a Page.</p>{canConfigure && <Link to="/organization/integrations" className="btn-primary mt-4">Configure integrations</Link>}</div>
						) : <>
							<fieldset><legend className="text-sm font-black text-slate-900">Destinations</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{destinations.map((destination) => <label key={destination.platform} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><input type="checkbox" checked={selected.includes(destination.platform)} onChange={() => setSelected((current) => current.includes(destination.platform) ? current.filter((item) => item !== destination.platform) : [...current, destination.platform])} className="h-4 w-4 accent-yepset-700" /><span><span className="block text-sm font-black text-slate-900">{destination.platform}</span><span className="block text-xs font-semibold text-slate-500">{destination.username ? `@${destination.username}` : destination.name}</span></span></label>)}</div></fieldset>
							{hasFacebook && <CaptionField label="Facebook caption" value={facebookCaption} maxLength={63206} disabled={!selected.includes("Facebook")} onChange={setFacebookCaption} />}
							{hasInstagram && <CaptionField label="Instagram caption" value={instagramCaption} maxLength={2200} disabled={!selected.includes("Instagram")} onChange={setInstagramCaption} />}
							<label className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm font-black text-slate-800"><span>Schedule for later</span><input type="checkbox" checked={isScheduled} onChange={(event) => setIsScheduled(event.target.checked)} className="h-4 w-4 accent-yepset-700" /></label>
							{isScheduled && <label className="mt-3 block text-sm font-black text-slate-700">Publish date and time<input type="datetime-local" required value={scheduledFor} min={minimumSchedule} onChange={(event) => setScheduledFor(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-semibold" /></label>}
							<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" disabled={isPublishing || selected.length === 0} className="btn-primary disabled:opacity-50">{isPublishing ? "Preparing post…" : isScheduled ? "Schedule post" : "Publish now"}</button></div>
						</>}
					</form>
				) : <PublicationHistory history={history} onChange={setHistory} />}
			</div>
		</div>
	);
}

function CaptionField({ label, value, maxLength, disabled, onChange }: { label: string; value: string; maxLength: number; disabled: boolean; onChange: (value: string) => void }) {
	return <label className={`mt-5 block text-sm font-black ${disabled ? "text-slate-400" : "text-slate-700"}`}>{label}<textarea value={value} maxLength={maxLength} disabled={disabled} rows={4} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-slate-900 disabled:bg-slate-100" /><span className="mt-1 block text-right text-xs font-semibold text-slate-400">{value.length.toLocaleString()} / {maxLength.toLocaleString()}</span></label>;
}

function PublicationHistory({ history, onChange }: { history: SocialPublication[]; onChange: (history: SocialPublication[]) => void }) {
	async function retry(publication: SocialPublication) {
		const updated = await socialPublicationsApi.retry(publication.id);
		onChange(history.map((item) => item.id === updated.id ? updated : item));
	}
	async function cancel(publication: SocialPublication) {
		const updated = await socialPublicationsApi.cancel(publication.id);
		onChange(history.map((item) => item.id === updated.id ? updated : item));
	}
	return <div className="p-5 sm:p-6">{history.length === 0 ? <p className="py-10 text-center text-sm font-semibold text-slate-500">No Meta publications yet.</p> : <div className="space-y-3">{history.map((publication) => <article key={publication.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-900">{publication.scheduledForUtc ? new Date(publication.scheduledForUtc).toLocaleString() : new Date(publication.createdAt).toLocaleString()}</p><p className="mt-1 text-xs font-semibold text-slate-500">{publication.deliveries.map((item) => item.platform).join(" + ")}</p></div><PublicationBadge status={publication.status} /></div><div className="mt-3 space-y-1">{publication.deliveries.map((delivery) => <div key={delivery.platform} className="flex items-center justify-between gap-3 text-xs"><span className="font-bold text-slate-700">{delivery.platform} · {delivery.destinationName}</span><span className={delivery.status === "Failed" ? "font-black text-rose-700" : "font-bold text-slate-500"}>{delivery.status}</span></div>)}</div>{publication.deliveries.some((item) => item.lastError) && <p className="mt-2 rounded-lg bg-rose-50 p-2 text-xs font-semibold text-rose-700">{publication.deliveries.find((item) => item.lastError)?.lastError}</p>}<div className="mt-3 flex gap-2">{["Failed", "PartiallyPublished"].includes(publication.status) && <button type="button" onClick={() => void retry(publication)} className="btn-secondary px-3 py-1.5 text-xs">Retry failed</button>}{["Draft", "Scheduled"].includes(publication.status) && <button type="button" onClick={() => void cancel(publication)} className="btn-secondary px-3 py-1.5 text-xs text-rose-700">Cancel</button>}</div></article>)}</div>}</div>;
}

function PublicationBadge({ status }: { status: SocialPublication["status"] }) {
	const colours = status === "Published" ? "bg-emerald-100 text-emerald-800" : status === "Failed" ? "bg-rose-100 text-rose-800" : status === "PartiallyPublished" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800";
	return <span className={`rounded-full px-2.5 py-1 text-xs font-black ${colours}`}>{status.replace(/([a-z])([A-Z])/g, "$1 $2")}</span>;
}

function defaultScheduleValue() { return toLocalDateTime(new Date(Date.now() + 60 * 60 * 1000)); }
function toLocalDateTime(date: Date) { const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000); return local.toISOString().slice(0, 16); }
function filenamePart(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "club"; }
