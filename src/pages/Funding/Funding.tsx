import { useEffect, useMemo, useState } from "react";

import ConfirmationModal from "../../components/compositions/ConfirmationModal";
import { fundingApi } from "../../services/fundingApi";
import type {
	FundingApplicationState,
	FundingOpportunity,
	FundingOpportunityStatus,
	SaveFundingOpportunityRequest,
} from "../../types/funding";
import FundingImportModal from "./FundingImportModal";
import FundingOpportunityModal from "./FundingOpportunityModal";

type StatusFilter = "All" | FundingOpportunityStatus;
type StateFilter = "All" | FundingApplicationState;

const stateLabels: Record<FundingApplicationState, string> = {
	Investigating: "Investigating",
	Preparing: "Preparing",
	Submitted: "Submitted",
	Completed: "Completed",
	Failed: "Unsuccessful",
	NotPursuing: "Not pursuing",
};

export default function Funding() {
	const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState("");
	const [actionError, setActionError] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
	const [stateFilter, setStateFilter] = useState<StateFilter>("All");
	const [isImportOpen, setIsImportOpen] = useState(false);
	const [isEditorOpen, setIsEditorOpen] = useState(false);
	const [selectedOpportunity, setSelectedOpportunity] = useState<FundingOpportunity | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<FundingOpportunity | null>(null);

	async function loadFunding() {
		setIsLoading(true);
		setLoadError("");
		try {
			setOpportunities(await fundingApi.getAll());
		} catch (error) {
			setLoadError(error instanceof Error ? error.message : "Funding opportunities could not be loaded.");
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		queueMicrotask(() => void loadFunding());
	}, []);

	const summary = useMemo(() => getFundingSummary(opportunities), [opportunities]);
	const filteredOpportunities = useMemo(() => {
		const query = search.trim().toLowerCase();
		return [...opportunities]
			.filter((opportunity) => {
				const matchesSearch = !query || [opportunity.name, opportunity.description, opportunity.amount]
					.some((value) => value.toLowerCase().includes(query));
				return matchesSearch && (statusFilter === "All" || opportunity.status === statusFilter) && (stateFilter === "All" || opportunity.applicationState === stateFilter);
			})
			.sort(compareFundingOpportunities);
	}, [opportunities, search, statusFilter, stateFilter]);

	function openCreate() {
		setSelectedOpportunity(null);
		setActionError("");
		setIsEditorOpen(true);
	}

	function openEdit(opportunity: FundingOpportunity) {
		setSelectedOpportunity(opportunity);
		setActionError("");
		setIsEditorOpen(true);
	}

	async function saveOpportunity(request: SaveFundingOpportunityRequest) {
		setIsSaving(true);
		setActionError("");
		try {
			if (selectedOpportunity) {
				const updated = await fundingApi.update(selectedOpportunity.id, request);
				setOpportunities((current) => current.map((item) => item.id === updated.id ? updated : item));
			} else {
				const created = await fundingApi.create(request);
				setOpportunities((current) => [...current, created]);
			}
			setIsEditorOpen(false);
			setSelectedOpportunity(null);
		} catch (error) {
			setActionError(error instanceof Error ? error.message : "The funding opportunity could not be saved.");
		} finally {
			setIsSaving(false);
		}
	}

	async function requestDelete(opportunity: FundingOpportunity) {
		setIsEditorOpen(false);
		setDeleteTarget(opportunity);
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		setIsSaving(true);
		setActionError("");
		try {
			await fundingApi.delete(deleteTarget.id);
			setOpportunities((current) => current.filter((item) => item.id !== deleteTarget.id));
			setDeleteTarget(null);
			setSelectedOpportunity(null);
		} catch (error) {
			setActionError(error instanceof Error ? error.message : "The funding opportunity could not be deleted.");
		} finally {
			setIsSaving(false);
		}
	}

	const filtersAreActive = Boolean(search || statusFilter !== "All" || stateFilter !== "All");

	return (
		<div className="space-y-5">
			<header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<p className="text-xs font-black uppercase tracking-[.18em] text-yepset-700">Manage club</p>
					<h1 className="mt-1 text-3xl font-black tracking-[-.035em] text-slate-950">Funding</h1>
					<p className="mt-1 max-w-2xl text-sm font-semibold text-slate-500">Track grant and funding opportunities from first look to completed application.</p>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row">
					<button type="button" onClick={() => setIsImportOpen(true)} className="btn-secondary inline-flex items-center justify-center gap-2"><ImportIcon />Import CSV</button>
					<button type="button" onClick={openCreate} className="btn-primary inline-flex items-center justify-center gap-2"><PlusIcon />Add opportunity</button>
				</div>
			</header>

			<section aria-label="Funding summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
				<SummaryCard label="Open opportunities" value={summary.open} tone="blue" icon="document" />
				<SummaryCard label="Closing soon" value={summary.closingSoon} helper="Within 30 days" tone="amber" icon="clock" />
				<SummaryCard label="Submitted" value={summary.submitted} tone="indigo" icon="send" />
				<SummaryCard label="Completed" value={summary.completed} tone="green" icon="check" />
			</section>

			<section className="surface-card overflow-hidden">
				<div className="grid gap-3 border-b border-slate-200 p-3 sm:p-4 lg:grid-cols-[minmax(18rem,1fr)_12rem_12rem]">
					<label className="relative">
						<span className="sr-only">Search funding opportunities</span>
						<SearchIcon />
						<input value={search} onChange={(event) => setSearch(event.target.value)} className="input-field" style={{ paddingLeft: "2.75rem" }} placeholder="Search funding opportunities…" />
					</label>
					<FilterSelect label="Status" value={statusFilter} onChange={(value) => setStatusFilter(value as StatusFilter)} options={["All", "Open", "Upcoming", "Rolling", "Restricted", "Closed"]} />
					<FilterSelect label="Progress" value={stateFilter} onChange={(value) => setStateFilter(value as StateFilter)} options={["All", "Investigating", "Preparing", "Submitted", "Completed", "Failed", "NotPursuing"]} formatOption={(value) => value === "All" ? "All" : stateLabels[value as FundingApplicationState]} />
				</div>

				{loadError && <div className="m-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800"><span>{loadError}</span><button type="button" onClick={() => void loadFunding()} className="rounded-lg bg-white px-3 py-1.5 text-red-800 shadow-sm">Try again</button></div>}
				{actionError && !isEditorOpen && <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{actionError}</div>}

				{isLoading ? (
					<div className="grid min-h-64 place-items-center p-8"><div className="text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-yepset-100 border-t-yepset-700" /><p className="mt-3 text-sm font-semibold text-slate-500">Loading funding opportunities…</p></div></div>
				) : filteredOpportunities.length === 0 ? (
					<FundingEmptyState hasAny={opportunities.length > 0} filtersAreActive={filtersAreActive} onAdd={openCreate} onClear={() => { setSearch(""); setStatusFilter("All"); setStateFilter("All"); }} />
				) : (
					<>
						<div className="hidden overflow-x-auto lg:block">
							<table className="w-full min-w-[1000px] text-left text-sm">
								<thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Opportunity</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Application</th><th className="px-4 py-3">Opens</th><th className="px-4 py-3">Closes</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Progress</th><th className="w-12 px-3 py-3"><span className="sr-only">Open</span></th></tr></thead>
								<tbody className="divide-y divide-slate-100">{filteredOpportunities.map((opportunity) => <FundingTableRow key={opportunity.id} opportunity={opportunity} onOpen={openEdit} />)}</tbody>
							</table>
						</div>
						<div className="divide-y divide-slate-100 lg:hidden">{filteredOpportunities.map((opportunity) => <FundingCard key={opportunity.id} opportunity={opportunity} onOpen={openEdit} />)}</div>
						<div className="border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-semibold text-slate-500 sm:px-5">Showing {filteredOpportunities.length} of {opportunities.length} {opportunities.length === 1 ? "opportunity" : "opportunities"}</div>
					</>
				)}
			</section>

			<FundingImportModal isOpen={isImportOpen} existingOpportunities={opportunities} onClose={() => setIsImportOpen(false)} onImported={loadFunding} />
			{isEditorOpen && <FundingOpportunityModal isOpen opportunity={selectedOpportunity} isSaving={isSaving} error={actionError} onClose={() => { if (!isSaving) { setIsEditorOpen(false); setSelectedOpportunity(null); setActionError(""); } }} onSave={saveOpportunity} onDelete={requestDelete} />}
			<ConfirmationModal isOpen={Boolean(deleteTarget)} title="Delete this funding opportunity?" message={deleteTarget ? `“${deleteTarget.name}” and its application notes will be removed.` : ""} confirmText="Delete opportunity" variant="danger" isBusy={isSaving} onCancel={() => { setDeleteTarget(null); setActionError(""); }} onConfirm={confirmDelete} />
		</div>
	);
}

function FundingTableRow({ opportunity, onOpen }: { opportunity: FundingOpportunity; onOpen: (opportunity: FundingOpportunity) => void }) {
	return (
		<tr className="group cursor-pointer bg-white transition hover:bg-yepset-50/45" onClick={() => onOpen(opportunity)}>
			<td className="max-w-sm px-5 py-4"><p className="font-black text-slate-900">{opportunity.name}</p><p className="mt-1 line-clamp-1 text-xs text-slate-500">{opportunity.description || "No description"}</p></td>
			<td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">{opportunity.amount || "Not specified"}</td>
			<td className="px-4 py-4">{opportunity.applicationUrl ? <a href={opportunity.applicationUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="inline-flex items-center gap-1.5 font-bold text-blue-700 hover:text-blue-900 hover:underline">View link<ExternalLinkIcon /></a> : <span className="text-slate-400">—</span>}</td>
			<td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatFundingDate(opportunity.startDate)}</td>
			<td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatFundingDate(opportunity.endDate)}</td>
			<td className="px-4 py-4"><StatusBadge status={opportunity.status} detail={opportunity.statusDetail} /></td>
			<td className="px-4 py-4"><StateBadge state={opportunity.applicationState} /></td>
			<td className="px-3 py-4 text-right"><span className="inline-grid h-8 w-8 place-items-center rounded-full text-xl text-slate-400 transition group-hover:bg-white group-hover:text-yepset-800">›</span></td>
		</tr>
	);
}

function FundingCard({ opportunity, onOpen }: { opportunity: FundingOpportunity; onOpen: (opportunity: FundingOpportunity) => void }) {
	return (
		<article className="bg-white p-4 sm:p-5" onClick={() => onOpen(opportunity)}>
			<div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-black leading-snug text-slate-900">{opportunity.name}</p><p className="mt-1 line-clamp-2 text-sm text-slate-500">{opportunity.description || "No description"}</p></div><button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-50 text-xl font-bold text-slate-400" aria-label={`Open ${opportunity.name}`}>›</button></div>
			<div className="mt-4 flex flex-wrap gap-2"><StatusBadge status={opportunity.status} detail={opportunity.statusDetail} /><StateBadge state={opportunity.applicationState} /></div>
			<div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm"><div><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Amount</p><p className="mt-1 font-bold text-slate-700">{opportunity.amount || "Not specified"}</p></div><div><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Closing date</p><p className="mt-1 font-bold text-slate-700">{formatFundingDate(opportunity.endDate)}</p></div></div>
			{opportunity.applicationUrl && <a href={opportunity.applicationUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700">View application<ExternalLinkIcon /></a>}
		</article>
	);
}

function SummaryCard({ label, value, helper, tone, icon }: { label: string; value: number; helper?: string; tone: "blue" | "amber" | "indigo" | "green"; icon: "document" | "clock" | "send" | "check" }) {
	const tones = { blue: "bg-blue-100 text-blue-700", amber: "bg-amber-100 text-amber-700", indigo: "bg-indigo-100 text-indigo-700", green: "bg-emerald-100 text-emerald-700" };
	return <article className="surface-card flex min-h-28 items-center gap-3 p-4 sm:gap-4 sm:p-5"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full sm:h-14 sm:w-14 ${tones[tone]}`}><SummaryIcon icon={icon} /></div><div className="min-w-0"><p className="text-xs font-bold text-slate-500 sm:text-sm">{label}</p><p className="mt-0.5 text-2xl font-black text-slate-950 sm:text-3xl">{value}</p>{helper && <p className="text-[11px] font-semibold text-slate-400 sm:text-xs">{helper}</p>}</div></article>;
}

function StatusBadge({ status, detail }: { status: FundingOpportunityStatus; detail: string }) {
	const tones: Record<FundingOpportunityStatus, string> = { Open: "bg-emerald-100 text-emerald-800", Upcoming: "bg-blue-100 text-blue-800", Rolling: "bg-amber-100 text-amber-800", Restricted: "bg-orange-100 text-orange-800", Closed: "bg-red-100 text-red-800" };
	return <span title={detail || status} className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ${tones[status]}`}>{status}</span>;
}

function StateBadge({ state }: { state: FundingApplicationState }) {
	const tones: Record<FundingApplicationState, string> = { Investigating: "bg-blue-100 text-blue-800", Preparing: "bg-amber-100 text-amber-800", Submitted: "bg-violet-100 text-violet-800", Completed: "bg-emerald-100 text-emerald-800", Failed: "bg-red-100 text-red-800", NotPursuing: "bg-slate-200 text-slate-700" };
	return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ${tones[state]}`}>{stateLabels[state]}</span>;
}

function FilterSelect({ label, value, options, onChange, formatOption = (option) => option }: { label: string; value: string; options: string[]; onChange: (value: string) => void; formatOption?: (value: string) => string }) {
	return <label><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="input-field"><option disabled>{label}</option>{options.map((option) => <option key={option} value={option}>{formatOption(option)}</option>)}</select></label>;
}

function FundingEmptyState({ hasAny, filtersAreActive, onAdd, onClear }: { hasAny: boolean; filtersAreActive: boolean; onAdd: () => void; onClear: () => void }) {
	return <div className="grid min-h-72 place-items-center px-5 py-10 text-center"><div className="max-w-md"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-yepset-50 text-yepset-700"><SummaryIcon icon="document" /></div><h2 className="mt-4 text-lg font-black text-slate-900">{hasAny ? "No opportunities match" : "Start your funding pipeline"}</h2><p className="mt-1 text-sm text-slate-500">{hasAny ? "Try changing the search or filters." : "Add an opportunity manually or import your existing funding list from CSV."}</p><button type="button" onClick={filtersAreActive ? onClear : onAdd} className="btn-primary mt-5">{filtersAreActive ? "Clear filters" : "Add first opportunity"}</button></div></div>;
}

function getFundingSummary(opportunities: FundingOpportunity[]) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const closingDate = new Date(today);
	closingDate.setDate(closingDate.getDate() + 30);
	return {
		open: opportunities.filter((item) => item.status !== "Closed").length,
		closingSoon: opportunities.filter((item) => item.status !== "Closed" && item.endDate && new Date(item.endDate) >= today && new Date(item.endDate) <= closingDate).length,
		submitted: opportunities.filter((item) => item.applicationState === "Submitted").length,
		completed: opportunities.filter((item) => item.applicationState === "Completed").length,
	};
}

function compareFundingOpportunities(first: FundingOpportunity, second: FundingOpportunity) {
	if (!first.endDate && !second.endDate) return first.name.localeCompare(second.name);
	if (!first.endDate) return 1;
	if (!second.endDate) return -1;
	return new Date(first.endDate).getTime() - new Date(second.endDate).getTime() || first.name.localeCompare(second.name);
}

function formatFundingDate(value?: string | null) {
	if (!value) return "No fixed date";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "Invalid date" : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function SearchIcon() { return <svg className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>; }
function PlusIcon() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v8m-4-4h8" /></svg>; }
function ImportIcon() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16V4m0 0L8 8m4-4 4 4M5 14v5h14v-5" /></svg>; }
function ExternalLinkIcon() { return <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 4h6v6m0-6-9 9" /><path d="M18 13v7H4V6h7" /></svg>; }
function SummaryIcon({ icon }: { icon: "document" | "clock" | "send" | "check" }) {
	const path = icon === "document" ? "M7 3h7l4 4v14H7V3Zm7 0v5h4M10 12h5m-5 4h5" : icon === "clock" ? "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 2" : icon === "send" ? "m3 11 18-8-8 18-2-8-8-2Zm8 2 10-10" : "M20 6 9 17l-5-5";
	return <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>;
}
