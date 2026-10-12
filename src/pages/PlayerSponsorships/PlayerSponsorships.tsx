import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useParams } from "react-router-dom";

import ConfirmationModal from "../../components/compositions/ConfirmationModal";
import { playerSponsorshipsApi } from "../../services/playerSponsorshipsApi";
import { usePlayerStore } from "../../stores/players";
import type { PlayerSponsorship, PlayerSponsorshipStatus } from "../../types/playerSponsorships";
import { formatDisplayDateTime } from "../../utils/date";
import PlayerSponsorshipPreview from "./PlayerSponsorshipPreview";

const maxImageBytes = 2 * 1024 * 1024;

export default function PlayerSponsorships() {
	const { goCode } = useParams<{ goCode: string }>();
	return goCode ? <PublicSponsorship goCode={goCode} /> : <SponsorshipManagement />;
}

function PublicSponsorship({ goCode }: { goCode: string }) {
	const [sponsorship, setSponsorship] = useState<PlayerSponsorship | null>(null);
	const [draft, setDraft] = useState({ sponsorName: "", sponsorDescription: "", sponsorImageDataUrl: "", termsAccepted: false });
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		void playerSponsorshipsApi.getPublic(goCode)
			.then((item) => {
				setSponsorship(item);
				setDraft({
					sponsorName: item.sponsorName,
					sponsorDescription: item.sponsorDescription,
					sponsorImageDataUrl: item.sponsorImageDataUrl,
					termsAccepted: item.termsAccepted,
				});
			})
			.catch((reason) => setError(reason instanceof Error ? reason.message : "This sponsorship link could not be opened."))
			.finally(() => setIsLoading(false));
	}, [goCode]);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSaving(true);
		setError("");
		try {
			const saved = await playerSponsorshipsApi.submit(goCode, draft);
			setSponsorship(saved);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Your sponsorship could not be submitted.");
		} finally {
			setIsSaving(false);
		}
	}

	const preview = sponsorship ? { ...sponsorship, ...draft } : null;
	const isComplete = sponsorship?.status === "Completed" || Boolean(sponsorship?.submittedAt);

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(21,128,113,.18),transparent_35%),#f8fafc] px-4 py-6 text-slate-900 sm:py-10">
			<div className="mx-auto max-w-6xl">
				<header className="mb-6 flex items-center justify-between rounded-2xl bg-yepset-950 px-5 py-4 text-white shadow-xl">
					<div><p className="text-xs font-black uppercase tracking-[.25em] text-kick-300">Yepset</p><h1 className="mt-1 text-xl font-black">Player sponsorship</h1></div>
					<span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black">{sponsorship?.clubName || "Club sponsorship"}</span>
				</header>

				{isLoading ? <PageMessage title="Opening sponsorship…" /> : error && !sponsorship ? <PageMessage title="This link is unavailable" detail={error} tone="error" /> : sponsorship && preview ? (
					<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,.85fr)] lg:items-start">
						<div className="order-2 lg:order-1">
							{isComplete ? (
								<section className="surface-card p-6 sm:p-8">
									<div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-2xl font-black text-emerald-700">✓</div>
									<h2 className="mt-4 text-2xl font-black">Sponsorship confirmed</h2>
									<p className="mt-2 text-sm leading-6 text-slate-600">Thank you for sponsoring {sponsorship.playerName}. This submission is now locked; a club administrator can make any necessary changes.</p>
									{sponsorship.submittedAt && <p className="mt-4 text-xs font-bold text-slate-400">Submitted {formatDisplayDateTime(sponsorship.submittedAt)}</p>}
								</section>
							) : (
								<form onSubmit={submit} className="surface-card p-5 sm:p-7">
									<p className="text-xs font-black uppercase tracking-[.18em] text-yepset-700">Sponsor {sponsorship.playerName}</p>
									<h2 className="mt-2 text-2xl font-black tracking-tight">Add your business to their player post</h2>
									<p className="mt-2 text-sm leading-6 text-slate-600">Enter the details you want the club to use. The preview updates as you type.</p>
									{error && <Alert>{error}</Alert>}
									<div className="mt-6 space-y-5">
										<label className="block"><FieldLabel>Sponsor or business name</FieldLabel><input required maxLength={120} className="input-field" value={draft.sponsorName} onChange={(event) => setDraft({ ...draft, sponsorName: event.target.value })} placeholder="e.g. Smith & Co Builders" /></label>
										<label className="block"><FieldLabel>Sponsor image or logo</FieldLabel><ImageInput required value={draft.sponsorImageDataUrl} onChange={(value) => setDraft({ ...draft, sponsorImageDataUrl: value })} onError={setError} /></label>
										<label className="block"><FieldLabel>Description</FieldLabel><textarea required maxLength={1000} rows={5} className="input-field resize-y" value={draft.sponsorDescription} onChange={(event) => setDraft({ ...draft, sponsorDescription: event.target.value })} placeholder="Tell supporters what your business does and how to contact you." /><span className="mt-1 block text-right text-xs font-semibold text-slate-400">{draft.sponsorDescription.length}/1000</span></label>
										<label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-5 text-slate-700"><input required type="checkbox" checked={draft.termsAccepted} onChange={(event) => setDraft({ ...draft, termsAccepted: event.target.checked })} className="mt-1 h-4 w-4 shrink-0" /><span><strong className="block text-slate-900">I agree to the sponsorship terms</strong><span className="mt-1 block">{sponsorship.termsText}</span></span></label>
									</div>
									<button type="submit" disabled={isSaving} className="btn-primary mt-6 w-full justify-center py-3 disabled:opacity-60">{isSaving ? "Submitting…" : "Confirm sponsorship"}</button>
									<p className="mt-3 text-center text-xs font-semibold text-slate-400">Once submitted, only a club administrator can edit these details.</p>
								</form>
							)}
						</div>
						<div className="order-1 lg:sticky lg:top-6 lg:order-2"><PlayerSponsorshipPreview sponsorship={preview} /></div>
					</div>
				) : null}
			</div>
		</div>
	);
}

function SponsorshipManagement() {
	const players = usePlayerStore((state) => state.players);
	const loadPlayers = usePlayerStore((state) => state.loadPlayers);
	const [items, setItems] = useState<PlayerSponsorship[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [createOpen, setCreateOpen] = useState(false);
	const [selectedPlayerId, setSelectedPlayerId] = useState("");
	const [editing, setEditing] = useState<PlayerSponsorship | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<PlayerSponsorship | null>(null);

	async function load() {
		setIsLoading(true);
		setError("");
		try { setItems(await playerSponsorshipsApi.getAll()); }
		catch (reason) { setError(reason instanceof Error ? reason.message : "Sponsorships could not be loaded."); }
		finally { setIsLoading(false); }
	}

	useEffect(() => {
		queueMicrotask(() => {
			void load();
			void loadPlayers();
		});
	}, [loadPlayers]);

	async function create(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!selectedPlayerId) return;
		setIsSaving(true); setError("");
		try {
			const created = await playerSponsorshipsApi.create(selectedPlayerId);
			setItems((current) => [created, ...current]);
			setCreateOpen(false); setSelectedPlayerId("");
			await copyShareLink(created);
		} catch (reason) { setError(reason instanceof Error ? reason.message : "Sponsorship window could not be created."); }
		finally { setIsSaving(false); }
	}

	async function openEdit(item: PlayerSponsorship) {
		setError("");
		try { setEditing(await playerSponsorshipsApi.getById(item.id)); }
		catch (reason) { setError(reason instanceof Error ? reason.message : "Sponsorship could not be opened."); }
	}

	async function saveEdit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault(); if (!editing) return;
		setIsSaving(true); setError("");
		try {
			const saved = await playerSponsorshipsApi.update(editing.id, {
				sponsorName: editing.sponsorName,
				sponsorDescription: editing.sponsorDescription,
				sponsorImageDataUrl: editing.sponsorImageDataUrl,
				status: editing.status,
			});
			setItems((current) => current.map((item) => item.id === saved.id ? saved : item));
			setEditing(null); setMessage("Sponsorship updated.");
		} catch (reason) { setError(reason instanceof Error ? reason.message : "Sponsorship could not be updated."); }
		finally { setIsSaving(false); }
	}

	async function copyShareLink(item: PlayerSponsorship) {
		const url = `${window.location.origin}/sponsor/${item.goCode}`;
		try { await navigator.clipboard.writeText(url); setMessage("Share link copied to clipboard."); }
		catch { window.prompt("Copy sponsorship link", url); }
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		setIsSaving(true); setError("");
		try { await playerSponsorshipsApi.delete(deleteTarget.id); setItems((current) => current.filter((item) => item.id !== deleteTarget.id)); setDeleteTarget(null); }
		catch (reason) { setError(reason instanceof Error ? reason.message : "Sponsorship could not be deleted."); }
		finally { setIsSaving(false); }
	}

	return (
		<div className="space-y-5">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div><p className="text-xs font-black uppercase tracking-[.18em] text-yepset-700">Manage club</p><h1 className="mt-1 text-3xl font-black tracking-[-.035em] text-slate-950">Player sponsorships</h1><p className="mt-1 max-w-2xl text-sm font-semibold text-slate-500">Open a player’s sponsorship window, share it with a business and manage completed submissions.</p></div>
				<button type="button" onClick={() => setCreateOpen(true)} className="btn-primary">New sponsorship window</button>
			</header>
			{error && <Alert>{error}</Alert>}{message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</div>}
			<section className="surface-card overflow-hidden">
				{isLoading ? <PageMessage title="Loading sponsorships…" /> : items.length === 0 ? <PageMessage title="No sponsorship windows yet" detail="Create one for a player, then share the public link with their sponsor." /> : (
					<><div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Player</th><th className="px-4 py-3">Sponsor</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id}><td className="px-5 py-4 font-black text-slate-900">{item.playerName}</td><td className="px-4 py-4 text-slate-600">{item.sponsorName || "Waiting for sponsor"}</td><td className="px-4 py-4"><StatusBadge status={item.status} /></td><td className="px-4 py-4 text-slate-500">{formatDisplayDateTime(item.updatedAt)}</td><td className="px-4 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => void copyShareLink(item)} className="btn-secondary px-3 py-1.5 text-xs">Copy link</button><button type="button" onClick={() => void openEdit(item)} className="btn-secondary px-3 py-1.5 text-xs">Manage</button></div></td></tr>)}</tbody></table></div>
					<div className="divide-y divide-slate-100 md:hidden">{items.map((item) => <article key={item.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-900">{item.playerName}</p><p className="mt-1 text-sm text-slate-500">{item.sponsorName || "Waiting for sponsor"}</p></div><StatusBadge status={item.status} /></div><div className="mt-4 flex gap-2"><button type="button" onClick={() => void copyShareLink(item)} className="btn-secondary flex-1 px-3 py-2 text-xs">Copy link</button><button type="button" onClick={() => void openEdit(item)} className="btn-primary flex-1 px-3 py-2 text-xs">Manage</button></div></article>)}</div></>
				)}
			</section>

			<SponsorshipModal isOpen={createOpen} title="New sponsorship window" onClose={() => setCreateOpen(false)}>
				<form onSubmit={create} className="space-y-5">{error && <Alert>{error}</Alert>}<label className="block"><FieldLabel>Player</FieldLabel><select required className="input-field" value={selectedPlayerId} onChange={(event) => setSelectedPlayerId(event.target.value)}><option value="">Select a player</option>{players.filter((player) => player.isActive).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select></label><p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">Creating the window gives you a public link to share. The sponsor can submit it once.</p><div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button><button type="submit" disabled={isSaving || !selectedPlayerId} className="btn-primary disabled:opacity-60">{isSaving ? "Creating…" : "Create and copy link"}</button></div></form>
			</SponsorshipModal>

			<SponsorshipModal isOpen={Boolean(editing)} title={editing ? `Manage ${editing.playerName} sponsorship` : "Manage sponsorship"} onClose={() => setEditing(null)} wide>
				{editing && <form onSubmit={saveEdit} className="grid gap-5 lg:grid-cols-2"><PlayerSponsorshipPreview sponsorship={editing} /><div className="space-y-4">{error && <Alert>{error}</Alert>}<label className="block"><FieldLabel>Sponsor name</FieldLabel><input className="input-field" maxLength={120} value={editing.sponsorName} onChange={(event) => setEditing({ ...editing, sponsorName: event.target.value })} /></label><label className="block"><FieldLabel>Sponsor image</FieldLabel><ImageInput value={editing.sponsorImageDataUrl} onChange={(value) => setEditing({ ...editing, sponsorImageDataUrl: value })} onError={setError} /></label><label className="block"><FieldLabel>Description</FieldLabel><textarea className="input-field" rows={4} maxLength={1000} value={editing.sponsorDescription} onChange={(event) => setEditing({ ...editing, sponsorDescription: event.target.value })} /></label><label className="block"><FieldLabel>Status</FieldLabel><select className="input-field" value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as PlayerSponsorshipStatus })}><option value="Open">Open</option><option value="Completed">Completed</option><option value="Closed">Closed</option></select></label>{editing.termsAcceptedAt && <p className="text-xs font-semibold text-slate-500">Terms accepted {formatDisplayDateTime(editing.termsAcceptedAt)}</p>}<div className="flex flex-wrap items-center justify-between gap-2"><button type="button" className="text-sm font-black text-rose-700" onClick={() => { setDeleteTarget(editing); setEditing(null); }}>Delete</button><div className="flex gap-2"><button type="button" className="btn-secondary" onClick={() => void copyShareLink(editing)}>Copy link</button><button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-60">{isSaving ? "Saving…" : "Save"}</button></div></div></div></form>}
			</SponsorshipModal>
			<ConfirmationModal isOpen={Boolean(deleteTarget)} title="Delete sponsorship?" message={deleteTarget ? `This permanently removes the sponsorship window for ${deleteTarget.playerName}.` : ""} confirmText="Delete sponsorship" variant="danger" isBusy={isSaving} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
		</div>
	);
}

function ImageInput({ value, onChange, onError, required = false }: { value: string; onChange: (value: string) => void; onError: (message: string) => void; required?: boolean }) {
	return <div><input required={required && !value} type="file" accept="image/jpeg,image/png,image/webp" className="block w-full rounded-xl border border-slate-200 bg-white p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-yepset-50 file:px-3 file:py-2 file:font-black file:text-yepset-800" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > maxImageBytes) { onError("Sponsor image must be 2MB or less."); event.target.value = ""; return; } const reader = new FileReader(); reader.onload = () => { onError(""); onChange(String(reader.result)); }; reader.onerror = () => onError("The sponsor image could not be read."); reader.readAsDataURL(file); }} />{value && <button type="button" className="mt-2 text-xs font-black text-rose-700" onClick={() => onChange("")}>Remove image</button>}<p className="mt-1 text-xs text-slate-400">JPEG, PNG or WebP, up to 2MB.</p></div>;
}

function SponsorshipModal({ isOpen, title, onClose, wide = false, children }: { isOpen: boolean; title: string; onClose: () => void; wide?: boolean; children: ReactNode }) {
	if (!isOpen) return null;
	return <div className="fixed inset-0 z-50 flex items-center justify-center bg-yepset-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}><div className={`max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-2xl border border-white/60 bg-white p-5 shadow-[0_24px_80px_rgba(8,42,40,.24)] sm:p-6 ${wide ? "max-w-4xl" : "max-w-md"}`}><div className="flex items-start justify-between gap-4"><h2 className="text-xl font-black tracking-[-.02em] text-slate-950">{title}</h2><button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xl font-bold text-slate-500" aria-label="Close">×</button></div><div className="mt-5">{children}</div></div></div>;
}
function FieldLabel({ children }: { children: ReactNode }) { return <span className="mb-1.5 block text-sm font-black text-slate-700">{children}</span>; }
function Alert({ children }: { children: ReactNode }) { return <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{children}</div>; }
function StatusBadge({ status }: { status: PlayerSponsorshipStatus }) { const style = status === "Completed" ? "bg-emerald-100 text-emerald-800" : status === "Open" ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-700"; return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${style}`}>{status}</span>; }
function PageMessage({ title, detail, tone = "default" }: { title: string; detail?: string; tone?: "default" | "error" }) { return <div className={`grid min-h-64 place-items-center rounded-2xl border p-8 text-center ${tone === "error" ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}><div><h2 className={`text-lg font-black ${tone === "error" ? "text-red-900" : "text-slate-900"}`}>{title}</h2>{detail && <p className={`mt-2 text-sm ${tone === "error" ? "text-red-700" : "text-slate-500"}`}>{detail}</p>}</div></div>; }
