import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { googleSheetsApi } from "../../services/googleSheetsApi";
import type { GoogleSheetValues } from "../../types/integrations";

export default function GoogleSheetViewer() {
	const [workbook, setWorkbook] = useState<GoogleSheetValues | null>(null);
	const [selectedSheet, setSelectedSheet] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	const load = useCallback(async (sheet?: string) => {
		try {
			setIsLoading(true); setError("");
			const loaded = await googleSheetsApi.getWorkbook(sheet);
			setWorkbook(loaded); setSelectedSheet(loaded.sheetName);
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : "The Google Sheet could not be loaded.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		let cancelled = false;
		googleSheetsApi.getWorkbook()
			.then((loaded) => {
				if (cancelled) return;
				setWorkbook(loaded);
				setSelectedSheet(loaded.sheetName);
			})
			.catch((loadError) => {
				if (!cancelled) setError(loadError instanceof Error ? loadError.message : "The Google Sheet could not be loaded.");
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});
		return () => { cancelled = true; };
	}, []);

	const columnCount = useMemo(() => Math.max(0, ...(workbook?.values.map((row) => row.length) ?? [0])), [workbook]);
	const columns = useMemo(() => Array.from({ length: columnCount }, (_, index) => columnLabel(index)), [columnCount]);

	return <div className="w-full min-w-0 space-y-5 overflow-hidden">
		<div className="flex flex-wrap items-start justify-between gap-4">
			<div><p className="text-xs font-black uppercase tracking-wide text-emerald-700">Connected workbook</p><h1 className="text-2xl font-black tracking-[-.03em] text-slate-950">Google Sheet</h1><p className="mt-1 text-sm text-slate-600">A read-only live view of the club spreadsheet. Match exports still use the existing Apps Script.</p></div>
			<div className="flex flex-wrap gap-2"><Link to="/stats" className="btn-secondary">Yepset stats</Link>{workbook?.spreadsheetUrl && <a href={workbook.spreadsheetUrl} target="_blank" rel="noreferrer" className="btn-secondary">Open in Google Sheets ↗</a>}<button type="button" onClick={() => void load(selectedSheet || undefined)} disabled={isLoading} className="btn-primary">{isLoading ? "Refreshing…" : "Refresh"}</button></div>
		</div>

		{error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800"><p>{error}</p><Link to="/organization/integrations" className="mt-3 inline-block underline">Open integration settings</Link></div>}

		{workbook && <div className="surface-card p-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-slate-500">Workbook</p><h2 className="font-black text-slate-950">{workbook.spreadsheetName}</h2></div><label className="text-xs font-black uppercase tracking-wide text-slate-500">Sheet tab<select value={selectedSheet} onChange={(event) => { const value = event.target.value; setSelectedSheet(value); void load(value); }} className="ml-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-900">{workbook.sheets.map((sheet) => <option key={sheet.sheetId} value={sheet.title}>{sheet.title}</option>)}</select></label></div><p className="mt-2 text-xs text-slate-500">Last refreshed {new Date(workbook.refreshedAt).toLocaleString()}</p></div>}

		{isLoading && !workbook && <div className="surface-card p-10 text-center text-sm font-semibold text-slate-500">Loading the connected Google Sheet…</div>}

		{workbook && !isLoading && workbook.values.length === 0 && <div className="surface-card p-10 text-center text-sm font-semibold text-slate-500">This sheet tab is empty.</div>}

		{workbook && workbook.values.length > 0 && <div className="max-h-[72vh] min-w-0 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
			<table className="border-collapse text-xs text-slate-800">
				<thead><tr><th className="sticky left-0 top-0 z-40 min-w-10 border-b border-r border-slate-300 bg-slate-100 px-2 py-1.5" />{columns.map((column, index) => <th key={column} className={`sticky top-0 z-30 min-w-24 border-b border-r border-slate-300 bg-slate-100 px-2 py-1.5 text-center font-bold text-slate-500 ${index === 0 ? "left-10 z-40" : index === 1 ? "left-[8.5rem] z-40" : ""}`}>{column}</th>)}</tr></thead>
				<tbody>{workbook.values.map((row, rowIndex) => <tr key={rowIndex}><th className="sticky left-0 z-20 w-10 min-w-10 border-b border-r border-slate-200 bg-slate-50 px-2 py-1.5 text-right font-medium text-slate-400">{rowIndex + 1}</th>{columns.map((_, columnIndex) => <td key={columnIndex} className={`min-w-24 whitespace-nowrap border-b border-r border-slate-200 px-2 py-1.5 ${columnIndex === 0 ? "sticky left-10 z-10 w-24 bg-white" : columnIndex === 1 ? "sticky left-[8.5rem] z-10 w-24 bg-white shadow-[1px_0_0_0_rgb(226,232,240)]" : ""}`}>{row[columnIndex] ?? ""}</td>)}</tr>)}</tbody>
			</table>
		</div>}
	</div>;
}

function columnLabel(index: number) {
	let value = index + 1;
	let label = "";
	while (value > 0) {
		value -= 1;
		label = String.fromCharCode(65 + (value % 26)) + label;
		value = Math.floor(value / 26);
	}
	return label;
}
