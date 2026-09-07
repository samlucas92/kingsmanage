import { useRef, useState } from "react";

import { fundingApi } from "../../services/fundingApi";
import type { FundingOpportunity, SaveFundingOpportunityRequest } from "../../types/funding";
import {
	fundingImportTemplate,
	parseFundingImportCsv,
	type FundingImportParseResult,
	type ParsedFundingImportRow,
} from "./fundingCsv";

type FundingImportModalProps = {
	isOpen: boolean;
	existingOpportunities: FundingOpportunity[];
	onClose: () => void;
	onImported: () => Promise<void>;
};

export default function FundingImportModal({ isOpen, existingOpportunities, onClose, onImported }: FundingImportModalProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [fileName, setFileName] = useState("");
	const [parseResult, setParseResult] = useState<FundingImportParseResult | null>(null);
	const [isImporting, setIsImporting] = useState(false);
	const [importError, setImportError] = useState("");
	const [importedCount, setImportedCount] = useState<number | null>(null);

	if (!isOpen) return null;

	const rows = parseResult?.rows ?? [];
	const invalidRows = rows.filter((row) => row.errors.length > 0);
	const canImport = rows.length > 0 && rows.length <= 250 && invalidRows.length === 0 && (parseResult?.fileErrors.length ?? 0) === 0 && !isImporting;

	function resetAndClose() {
		if (isImporting) return;
		setFileName("");
		setParseResult(null);
		setImportError("");
		setImportedCount(null);
		onClose();
	}

	async function handleFile(file?: File) {
		if (!file) return;
		setFileName(file.name);
		setImportError("");
		setImportedCount(null);
		try {
			setParseResult(parseFundingImportCsv(await file.text(), existingOpportunities));
		} catch {
			setParseResult({ rows: [], fileErrors: ["The CSV file could not be read."] });
		}
	}

	async function handleImport() {
		if (!canImport) return;
		setIsImporting(true);
		setImportError("");
		try {
			const result = await fundingApi.bulkImport(rows.map(toRequest));
			setImportedCount(result.opportunityCount);
			await onImported();
		} catch (error) {
			setImportError(error instanceof Error ? error.message : "The funding opportunities could not be imported.");
		} finally {
			setIsImporting(false);
		}
	}

	function downloadTemplate() {
		const blob = new Blob([fundingImportTemplate], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "yepset-funding-import-template.csv";
		link.click();
		URL.revokeObjectURL(url);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-yepset-950/55 p-3 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-labelledby="funding-import-title">
			<div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_24px_80px_rgba(8,42,40,.24)] sm:max-h-[calc(100vh-2.5rem)]">
				<header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
					<div>
						<p className="text-xs font-black uppercase tracking-[.16em] text-yepset-700">Bulk funding import</p>
						<h2 id="funding-import-title" className="mt-1 text-xl font-black tracking-[-.02em] text-slate-950">Import opportunities from CSV</h2>
						<p className="mt-1 text-sm text-slate-600">Review every row before adding it to the club funding pipeline.</p>
					</div>
					<button type="button" onClick={resetAndClose} disabled={isImporting} className="rounded-lg p-2 text-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50" aria-label="Close import">×</button>
				</header>

				<div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
					{importedCount !== null ? (
						<div className="mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-7 text-center">
							<div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-2xl font-black text-white">✓</div>
							<h3 className="mt-4 text-xl font-black text-emerald-950">Import complete</h3>
							<p className="mt-2 text-sm text-emerald-900">{importedCount} funding {importedCount === 1 ? "opportunity was" : "opportunities were"} added.</p>
						</div>
					) : (
						<div className="space-y-5">
							<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
								<input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void handleFile(event.target.files?.[0])} />
								<p className="font-bold text-slate-900">Choose your funding CSV</p>
								<p className="mt-1 text-sm text-slate-600">Columns: name, description, amount, application_url, start_date, end_date and status.</p>
								<div className="mt-4 flex flex-wrap gap-2">
									<button type="button" onClick={() => inputRef.current?.click()} className="btn-primary">{fileName ? "Choose another file" : "Choose CSV file"}</button>
									<button type="button" onClick={downloadTemplate} className="btn-secondary">Download template</button>
								</div>
								{fileName && <p className="mt-3 text-sm font-bold text-slate-700">{fileName}</p>}
							</div>

							<div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">Dates may be blank, YYYY-MM-DD or DD/MM/YYYY. Imported opportunities start in the <strong>Investigating</strong> stage.</div>
							{parseResult?.fileErrors.map((error) => <div key={error} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{error}</div>)}
							{rows.length > 250 && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">This file has {rows.length} rows. Import up to 250 opportunities at a time.</div>}

							{rows.length > 0 && (
								<section>
									<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
										<div><h3 className="font-black text-slate-900">Preview</h3><p className="text-sm text-slate-600">{rows.length} {rows.length === 1 ? "opportunity" : "opportunities"} found · {invalidRows.length === 0 ? "ready to import" : `${invalidRows.length} need attention`}</p></div>
										<span className={`rounded-full px-3 py-1 text-xs font-bold ${invalidRows.length === 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{invalidRows.length === 0 ? "Valid CSV" : "Fix errors"}</span>
									</div>
									<div className="overflow-hidden rounded-xl border border-slate-200">
										<div className="hidden max-h-96 overflow-auto md:block">
											<table className="w-full min-w-[900px] text-left text-sm">
												<thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Opportunity</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Dates</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Validation</th></tr></thead>
												<tbody className="divide-y divide-slate-200">{rows.map((row) => <PreviewRow key={row.rowNumber} row={row} />)}</tbody>
											</table>
										</div>
										<div className="divide-y divide-slate-200 md:hidden">{rows.map((row) => <PreviewCard key={row.rowNumber} row={row} />)}</div>
									</div>
								</section>
							)}
							{importError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{importError}</div>}
						</div>
					)}
				</div>

				<footer className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
					{importedCount !== null ? (
						<button type="button" onClick={resetAndClose} className="btn-primary">Done</button>
					) : (
						<><button type="button" onClick={resetAndClose} disabled={isImporting} className="btn-secondary">Cancel</button><button type="button" onClick={() => void handleImport()} disabled={!canImport} className="btn-primary disabled:cursor-not-allowed disabled:bg-slate-300">{isImporting ? "Importing…" : `Import ${rows.length || ""} ${rows.length === 1 ? "opportunity" : "opportunities"}`}</button></>
					)}
				</footer>
			</div>
		</div>
	);
}

function PreviewRow({ row }: { row: ParsedFundingImportRow }) {
	return <tr className={row.errors.length ? "bg-red-50" : "bg-white"}><td className="px-3 py-3 font-semibold text-slate-500">{row.rowNumber}</td><td className="max-w-xs px-3 py-3"><p className="font-bold text-slate-900">{row.name}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{row.description || "No description"}</p></td><td className="whitespace-nowrap px-3 py-3">{row.amount || "—"}</td><td className="whitespace-nowrap px-3 py-3">{formatDateRange(row.startDate, row.endDate)}</td><td className="px-3 py-3">{row.rawStatus}</td><td className="max-w-xs px-3 py-3">{row.errors.length ? <span className="font-semibold text-red-700">{row.errors.join(" ")}</span> : <span className="font-semibold text-emerald-700">Ready</span>}</td></tr>;
}

function PreviewCard({ row }: { row: ParsedFundingImportRow }) {
	return <div className={`p-4 ${row.errors.length ? "bg-red-50" : "bg-white"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{row.name || "Unnamed opportunity"}</p><p className="mt-1 text-sm text-slate-600">{row.amount || "Amount not specified"} · {row.rawStatus || "No status"}</p><p className="mt-1 text-xs text-slate-500">{formatDateRange(row.startDate, row.endDate)}</p></div><span className="text-xs font-bold text-slate-500">Row {row.rowNumber}</span></div>{row.errors.length > 0 && <p className="mt-3 text-sm font-semibold text-red-700">{row.errors.join(" ")}</p>}</div>;
}

function formatDateRange(startDate?: string | null, endDate?: string | null) {
	if (!startDate && !endDate) return "No fixed dates";
	return `${startDate || "—"} → ${endDate || "—"}`;
}

function toRequest(row: ParsedFundingImportRow): SaveFundingOpportunityRequest {
	return {
		name: row.name,
		description: row.description,
		amount: row.amount,
		applicationUrl: row.applicationUrl,
		startDate: row.startDate,
		endDate: row.endDate,
		status: row.status,
		statusDetail: row.statusDetail,
		applicationState: row.applicationState,
		notes: row.notes,
	};
}
