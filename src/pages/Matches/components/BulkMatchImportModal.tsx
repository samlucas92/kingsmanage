import { useRef, useState } from "react";

import { matchApi, type BulkMatchImportResult } from "../../../services/matchApi";
import type { Match } from "../../../stores/match";
import type { ClubTeamProfile } from "../../../stores/clubTeams";
import {
	matchImportTemplate,
	parseMatchImportCsv,
	type MatchImportParseResult,
} from "../bulkMatchCsv";

type BulkMatchImportModalProps = {
	isOpen: boolean;
	seasonId: string;
	seasonName: string;
	teamProfiles: ClubTeamProfile[];
	existingMatches: Match[];
	defaultFormationKey: string;
	onClose: () => void;
	onImported: (result: BulkMatchImportResult, createdEvents: boolean) => Promise<void>;
};

export function BulkMatchImportModal({
	isOpen,
	seasonId,
	seasonName,
	teamProfiles,
	existingMatches,
	defaultFormationKey,
	onClose,
	onImported,
}: BulkMatchImportModalProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [fileName, setFileName] = useState("");
	const [parseResult, setParseResult] = useState<MatchImportParseResult | null>(null);
	const [createEvents, setCreateEvents] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [importError, setImportError] = useState("");
	const [importResult, setImportResult] = useState<BulkMatchImportResult | null>(null);

	if (!isOpen) return null;

	const rows = parseResult?.rows ?? [];
	const invalidRows = rows.filter((row) => row.errors.length > 0);
	const canImport =
		rows.length > 0 &&
		rows.length <= 100 &&
		invalidRows.length === 0 &&
		(parseResult?.fileErrors.length ?? 0) === 0 &&
		!isImporting;
	const activeTeamNames = teamProfiles
		.filter((team) => team.isActive)
		.map((team) => team.displayName)
		.join(", ");

	function resetAndClose() {
		if (isImporting) return;
		setFileName("");
		setParseResult(null);
		setCreateEvents(false);
		setImportError("");
		setImportResult(null);
		onClose();
	}

	async function handleFile(file?: File) {
		if (!file) return;

		setFileName(file.name);
		setImportError("");
		setImportResult(null);

		try {
			const text = await file.text();
			setParseResult(parseMatchImportCsv(text, teamProfiles, existingMatches));
		} catch {
			setParseResult({ rows: [], fileErrors: ["The CSV file could not be read."] });
		}
	}

	function downloadTemplate() {
		const blob = new Blob([matchImportTemplate], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "yepset-match-import-template.csv";
		link.click();
		URL.revokeObjectURL(url);
	}

	async function handleImport() {
		if (!canImport) return;

		try {
			setIsImporting(true);
			setImportError("");
			const result = await matchApi.bulkImportMatches({
				seasonId,
				createEvents,
				matches: rows.map((row) => ({
					teamId: row.teamId,
					teamName: row.teamName,
					opponent: row.opponent,
					competition: row.competition,
					date: row.dateTime,
					venue: row.venue,
					location: row.location,
					formationKey: defaultFormationKey,
				})),
			});

			setImportResult(result);

			try {
				await onImported(result, createEvents);
			} catch {
				// The import succeeded; page-level stores surface any refresh error separately.
			}
		} catch (error) {
			setImportError(error instanceof Error ? error.message : "The matches could not be imported.");
		} finally {
			setIsImporting(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-yepset-950/55 p-3 backdrop-blur-sm sm:p-5">
			<div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_24px_80px_rgba(8,42,40,.24)] sm:max-h-[calc(100vh-2.5rem)]">
				<div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
					<div>
						<p className="text-xs font-bold uppercase tracking-wide text-yepset-700">Bulk fixture import</p>
						<h2 className="mt-1 text-xl font-black tracking-[-.02em] text-slate-950">Import matches from CSV</h2>
						<p className="mt-1 text-sm text-slate-600">Matches will be added to {seasonName || "the selected season"}.</p>
					</div>
					<button type="button" onClick={resetAndClose} disabled={isImporting} className="rounded-lg p-2 text-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50" aria-label="Close import">×</button>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
					{importResult ? (
						<div className="mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
							<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-2xl font-black text-white">✓</div>
							<h3 className="mt-4 text-xl font-black text-emerald-950">Import complete</h3>
							<p className="mt-2 text-sm text-emerald-900">
								{importResult.matchCount} {importResult.matchCount === 1 ? "match was" : "matches were"} created
								{importResult.eventCount > 0 ? ` with ${importResult.eventCount} calendar ${importResult.eventCount === 1 ? "event" : "events"}.` : "."}
							</p>
						</div>
					) : (
						<div className="space-y-5">
							<div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
								<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
									<input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void handleFile(event.target.files?.[0])} />
									<p className="font-bold text-slate-900">Choose your fixtures CSV</p>
									<p className="mt-1 text-sm text-slate-600">Required columns: date, time, team, opponent, venue, location and competition.</p>
									<div className="mt-4 flex flex-wrap gap-2">
										<button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl bg-yepset-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-yepset-800">{fileName ? "Choose another file" : "Choose CSV file"}</button>
										<button type="button" onClick={downloadTemplate} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-100">Download template</button>
									</div>
									{fileName && <p className="mt-3 text-sm font-semibold text-slate-700">{fileName}</p>}
								</div>

								<label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-5 hover:bg-slate-50">
									<input type="checkbox" checked={createEvents} onChange={(event) => setCreateEvents(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-yepset-700" />
									<span>
										<span className="block font-bold text-slate-900">Create calendar events</span>
										<span className="mt-1 block text-sm text-slate-600">Creates a linked two-hour match event for every imported fixture.</span>
									</span>
								</label>
							</div>

							<div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
								Use Home or Away for venue. Dates can be YYYY-MM-DD or DD/MM/YYYY. Team can be a team name, short name or ID. Available teams: {activeTeamNames || "none"}.
							</div>

							{parseResult?.fileErrors.map((error) => (
								<div key={error} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</div>
							))}

							{rows.length > 100 && (
								<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">This file has {rows.length} rows. Import up to 100 matches at a time.</div>
							)}

							{rows.length > 0 && (
								<section>
									<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
										<div>
											<h3 className="font-black text-slate-900">Preview</h3>
											<p className="text-sm text-slate-600">{rows.length} {rows.length === 1 ? "match" : "matches"} found · {invalidRows.length === 0 ? "ready to import" : `${invalidRows.length} need attention`}</p>
										</div>
										<span className={`rounded-full px-3 py-1 text-xs font-bold ${invalidRows.length === 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{invalidRows.length === 0 ? "Valid CSV" : "Fix errors"}</span>
									</div>

									<div className="overflow-hidden rounded-xl border border-slate-200">
										<div className="hidden max-h-80 overflow-auto md:block">
											<table className="w-full min-w-[850px] text-left text-sm">
												<thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Kick-off</th><th className="px-3 py-2">Team</th><th className="px-3 py-2">Opponent</th><th className="px-3 py-2">Venue</th><th className="px-3 py-2">Location</th><th className="px-3 py-2">Competition</th><th className="px-3 py-2">Status</th></tr></thead>
												<tbody className="divide-y divide-slate-200">
													{rows.map((row) => <PreviewTableRow key={row.rowNumber} row={row} />)}
												</tbody>
											</table>
										</div>
										<div className="divide-y divide-slate-200 md:hidden">
											{rows.map((row) => <PreviewCard key={row.rowNumber} row={row} />)}
										</div>
									</div>
								</section>
							)}

							{importError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{importError}</div>}
						</div>
					)}
				</div>

				<div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
					{importResult ? (
						<button type="button" onClick={resetAndClose} className="rounded-xl bg-yepset-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-yepset-800">Done</button>
					) : (
						<>
							<button type="button" onClick={resetAndClose} disabled={isImporting} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-50">Cancel</button>
							<button type="button" onClick={() => void handleImport()} disabled={!canImport} className="rounded-xl bg-yepset-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-yepset-800 disabled:cursor-not-allowed disabled:bg-slate-300">{isImporting ? "Importing…" : `Import ${rows.length || ""} ${rows.length === 1 ? "match" : "matches"}`}</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

function PreviewTableRow({ row }: { row: MatchImportParseResult["rows"][number] }) {
	return (
		<tr className={row.errors.length > 0 ? "bg-red-50" : "bg-white"}>
			<td className="px-3 py-3 font-semibold text-slate-500">{row.rowNumber}</td>
			<td className="whitespace-nowrap px-3 py-3">{row.date} {row.time}</td>
			<td className="px-3 py-3 font-semibold">{row.teamName}</td>
			<td className="px-3 py-3">{row.opponent}</td>
			<td className="px-3 py-3 capitalize">{row.venue}</td>
			<td className="px-3 py-3">{row.location}</td>
			<td className="px-3 py-3">{row.competition}</td>
			<td className="px-3 py-3">{row.errors.length > 0 ? <span className="font-semibold text-red-700">{row.errors.join(" ")}</span> : <span className="font-semibold text-emerald-700">Ready</span>}</td>
		</tr>
	);
}

function PreviewCard({ row }: { row: MatchImportParseResult["rows"][number] }) {
	return (
		<div className={`p-4 ${row.errors.length > 0 ? "bg-red-50" : "bg-white"}`}>
			<div className="flex items-start justify-between gap-3">
				<div><p className="font-bold text-slate-900">{row.teamName} · {row.opponent}</p><p className="mt-1 text-sm text-slate-600">{row.date} at {row.time} · <span className="capitalize">{row.venue}</span></p><p className="mt-1 text-sm text-slate-600">{row.location} · {row.competition}</p></div>
				<span className="text-xs font-bold text-slate-500">Row {row.rowNumber}</span>
			</div>
			{row.errors.length > 0 && <p className="mt-3 text-sm font-semibold text-red-700">{row.errors.join(" ")}</p>}
		</div>
	);
}
