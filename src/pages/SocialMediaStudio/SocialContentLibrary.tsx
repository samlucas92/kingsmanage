import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import ManagedFileImage from "../../components/files/ManagedFileImage";
import { filesApi } from "../../services/filesApi";
import { socialPublicationsApi } from "../../services/socialPublicationsApi";
import type { SocialPublication } from "../../types/integrations";

type Filter = "All" | SocialPublication["status"];

export default function SocialContentLibrary() {
	const [items, setItems] = useState<SocialPublication[]>([]);
	const [filter, setFilter] = useState<Filter>("All");
	const [search, setSearch] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [busyId, setBusyId] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		socialPublicationsApi.getHistory(100)
			.then(setItems)
			.catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Content could not be loaded."))
			.finally(() => setIsLoading(false));
	}, []);

	const visible = useMemo(() => {
		const query = search.trim().toLowerCase();
		return items.filter((item) => (filter === "All" || item.status === filter) && (!query || item.title.toLowerCase().includes(query) || item.facebookCaption.toLowerCase().includes(query) || item.instagramCaption.toLowerCase().includes(query)));
	}, [filter, items, search]);

	async function update(item: SocialPublication, action: "publish" | "draft" | "retry" | "cancel") {
		try {
			setBusyId(item.id);
			setError("");
			const updated = action === "publish"
				? await socialPublicationsApi.queue(item.id, "PublishNow")
				: action === "draft"
					? await socialPublicationsApi.queue(item.id, "FacebookDraft")
					: action === "retry"
						? await socialPublicationsApi.retry(item.id)
						: await socialPublicationsApi.cancel(item.id);
			setItems((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
		} catch (actionError) {
			setError(actionError instanceof Error ? actionError.message : "The content action failed.");
		} finally {
			setBusyId("");
		}
	}

	async function download(item: SocialPublication) {
		if (!item.fileId) return;
		try {
			const response = await filesApi.getDownloadUrl(item.fileId);
			const anchor = document.createElement("a");
			anchor.href = response.downloadUrl;
			anchor.download = `${filenamePart(item.title)}.jpg`;
			anchor.target = "_blank";
			anchor.rel = "noreferrer";
			anchor.click();
		} catch (downloadError) {
			setError(downloadError instanceof Error ? downloadError.message : "The image could not be downloaded.");
		}
	}

	return <div className="space-y-5">
		<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div><Link to="/social-media" className="text-sm font-bold text-yepset-700">← Social Media Studio</Link><h1 className="mt-2 text-2xl font-black text-slate-950">Content library</h1><p className="mt-1 text-sm text-slate-600">Your saved, drafted and published club content in one place.</p></div>
			<Link to="/social-media" className="btn-primary w-fit">Create content</Link>
		</header>
		{error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">{error}</div>}
		<section className="surface-card p-4"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search content" className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold" /><select value={filter} onChange={(event) => setFilter(event.target.value as Filter)} className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold"><option>All</option><option>Draft</option><option>MetaDraft</option><option>Scheduled</option><option>Processing</option><option>Published</option><option>PartiallyPublished</option><option>Failed</option><option>Cancelled</option></select></div></section>
		{isLoading ? <div className="py-16 text-center text-sm font-semibold text-slate-500">Loading content…</div> : visible.length === 0 ? <div className="surface-card px-5 py-16 text-center"><p className="font-black text-slate-900">No content in this view</p><p className="mt-1 text-sm text-slate-500">Create a graphic and save it to start your library.</p></div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map((item) => <ContentCard key={item.id} item={item} busy={busyId === item.id} onUpdate={update} onDownload={download} />)}</div>}
	</div>;
}

function ContentCard({ item, busy, onUpdate, onDownload }: { item: SocialPublication; busy: boolean; onUpdate: (item: SocialPublication, action: "publish" | "draft" | "retry" | "cancel") => void; onDownload: (item: SocialPublication) => void }) {
	const hasFacebook = item.deliveries.some((delivery) => delivery.platform === "Facebook");
	return <article className="surface-card overflow-hidden">
		{item.fileId ? <ManagedFileImage fileId={item.fileId} alt={item.title} className="aspect-square w-full rounded-none object-cover" /> : <div className="grid aspect-square place-items-center bg-slate-100 text-sm font-bold text-slate-400">No preview</div>}
		<div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-black text-slate-950">{item.title}</h2><p className="mt-1 text-xs font-semibold text-slate-500">{item.deliveries.map((delivery) => delivery.platform).join(" + ")} · {new Date(item.updatedAt).toLocaleString()}</p></div><StatusBadge status={item.status} /></div>
			<p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-600">{item.facebookCaption || item.instagramCaption || "No caption"}</p>
			<div className="mt-4 flex flex-wrap gap-2"><Link to={`/social-media?contentId=${item.id}`} className="btn-secondary px-3 py-1.5 text-xs">Use as new</Link><button type="button" onClick={() => void onDownload(item)} disabled={!item.fileId || busy} className="btn-secondary px-3 py-1.5 text-xs">Download</button>{item.status === "MetaDraft" && <a href="https://business.facebook.com/" target="_blank" rel="noreferrer" className="btn-primary px-3 py-1.5 text-xs">Open Meta Business Suite ↗</a>}{item.status === "Draft" && <><button type="button" onClick={() => onUpdate(item, "publish")} disabled={busy} className="btn-primary px-3 py-1.5 text-xs">Publish now</button>{hasFacebook && <button type="button" onClick={() => onUpdate(item, "draft")} disabled={busy} className="btn-secondary px-3 py-1.5 text-xs">Send Facebook draft</button>}</>}{["Failed", "PartiallyPublished"].includes(item.status) && <button type="button" onClick={() => onUpdate(item, "retry")} disabled={busy} className="btn-secondary px-3 py-1.5 text-xs">Retry</button>}{["Draft", "Scheduled"].includes(item.status) && <button type="button" onClick={() => onUpdate(item, "cancel")} disabled={busy} className="px-3 py-1.5 text-xs font-black text-rose-700">Cancel</button>}</div>
		</div>
	</article>;
}

function StatusBadge({ status }: { status: SocialPublication["status"] }) {
	const label = status === "MetaDraft" ? "Meta draft" : status.replace(/([a-z])([A-Z])/g, "$1 $2");
	const colour = status === "Published" ? "bg-emerald-100 text-emerald-800" : status === "Failed" ? "bg-rose-100 text-rose-800" : status === "MetaDraft" ? "bg-violet-100 text-violet-800" : "bg-sky-100 text-sky-800";
	return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${colour}`}>{label}</span>;
}

function filenamePart(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "social-content"; }
