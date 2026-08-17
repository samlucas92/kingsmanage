import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import RichTextEditor from "../../components/rich-text/RichTextEditor";
import { handoverApi } from "../../services/handoverApi";
import { useAuthStore } from "../../stores/auth";
import type { OrganizationDocument } from "../../types/handover";
import { emptyRichText, isRichTextEmpty, serializeRichText } from "../../utils/richText";
import { ErrorBanner, VaultFrame } from "./HandoverFrame";
import { formatDate } from "./handoverFormat";

export default function OrganizationDocuments() {
	const { documentId } = useParams();
	return documentId ? <DocumentEditor documentId={documentId} /> : <DocumentList />;
}

function DocumentList() {
	const [documents, setDocuments] = useState<OrganizationDocument[]>([]);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const [showArchived, setShowArchived] = useState(false);
	const isAdmin = useAuthStore((state) => state.currentUser?.role === "Admin");
	useEffect(() => { void handoverApi.getDocuments().then(setDocuments).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Failed to load documents.")).finally(() => setLoading(false)); }, []);
	const visible = documents.filter((document) => showArchived || !document.isArchived);
	return <VaultFrame><section className="surface-card p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-black">Organisation documents</h2><p className="mt-1 text-sm text-slate-500">The source of truth for process knowledge linked throughout Handover Vault.</p></div><Link className="btn-primary" to="/handover/documents/new">Create document</Link></div><label className="mt-5 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> Show archived</label></section>{error && <ErrorBanner message={error} />}{loading ? <p className="text-sm text-slate-500">Loading documents…</p> : <section className="surface-card overflow-hidden"><div className="divide-y divide-slate-100">{visible.map((document) => <article key={document.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 text-xl text-blue-700">▤</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-black">{document.title}</h3>{document.isArchived && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">Archived</span>}</div><p className="mt-1 text-xs text-slate-500">Updated {formatDate(document.updatedAt)} by {document.createdByUserEmail || "an organisation member"}</p></div><div className="flex gap-2"><Link className="btn-secondary" to={`/handover/documents/${document.id}`}>{document.isArchived ? "View" : "Open"}</Link>{isAdmin && <button className="btn-secondary" onClick={async () => { try { const updated = await handoverApi.setDocumentArchived(document.id, !document.isArchived); setDocuments((current) => current.map((item) => item.id === updated.id ? updated : item)); } catch (archiveError) { setError(archiveError instanceof Error ? archiveError.message : "Failed to update document."); } }}>{document.isArchived ? "Restore" : "Archive"}</button>}</div></article>)}{visible.length === 0 && <p className="p-6 text-sm text-slate-500">No organisation documents yet.</p>}</div></section>}</VaultFrame>;
}

function DocumentEditor({ documentId }: { documentId: string }) {
	const isNew = documentId === "new";
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const returnTo = safeReturnPath(searchParams.get("returnTo"));
	const [document, setDocument] = useState<OrganizationDocument | null>(isNew ? { id: "", title: "", body: serializeRichText(emptyRichText), isArchived: false, createdByUserId: "", createdByUserEmail: "", createdAt: "", updatedAt: "" } : null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(!isNew);
	const [saving, setSaving] = useState(false);
	const [draftId] = useState(() => crypto.randomUUID());
	useEffect(() => { if (!isNew) void handoverApi.getDocument(documentId).then(setDocument).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Failed to load document.")).finally(() => setLoading(false)); }, [documentId, isNew]);
	async function save(event: FormEvent) {
		event.preventDefault(); if (!document) return; setSaving(true);
		try { const saved = isNew ? await handoverApi.createDocument(document.title, document.body) : await handoverApi.updateDocument(document.id, document.title, document.body); navigate(returnTo ?? `/handover/documents/${saved.id}`, { replace: true }); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Failed to save document."); } finally { setSaving(false); }
	}
	return <VaultFrame>{loading || !document ? <p className="text-sm text-slate-500">Loading document…</p> : <form onSubmit={save} className="surface-card p-5 sm:p-6"><div className="flex items-center justify-between"><Link to={returnTo ?? "/handover/documents"} className="text-sm font-bold text-yepset-700">← {returnTo ? "Return to role" : "Organisation documents"}</Link>{document.isArchived && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">Archived</span>}</div><div className="mt-5"><label className="text-sm font-bold text-slate-700">Document title<input required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xl font-black" value={document.title} disabled={document.isArchived} onChange={(event) => setDocument({ ...document, title: event.target.value })} /></label></div><div className="mt-5"><p className="mb-2 text-sm font-bold text-slate-700">Document content</p><div className={document.isArchived ? "pointer-events-none opacity-70" : ""}><RichTextEditor key={document.id || "new"} value={document.body} onChange={(body) => setDocument({ ...document, body })} placeholder="Explain how this responsibility is fulfilled…" imageOwner={{ linkedEntityType: isNew ? "RichTextDraft" : "ClubDocument", linkedEntityId: isNew ? draftId : document.id }} /></div></div><p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">Do not include passwords, recovery codes or other authentication secrets.</p>{error && <div className="mt-4"><ErrorBanner message={error} /></div>}<div className="mt-5 flex justify-end gap-2 border-t border-slate-200 pt-4"><Link to={returnTo ?? "/handover/documents"} className="btn-secondary">Cancel</Link>{!document.isArchived && <button className="btn-primary" disabled={saving || !document.title.trim() || isRichTextEmpty(document.body)}>{saving ? "Saving…" : "Save document"}</button>}</div></form>}</VaultFrame>;
}

function safeReturnPath(value: string | null) { return value?.startsWith("/handover/") && !value.startsWith("//") ? value : null; }
