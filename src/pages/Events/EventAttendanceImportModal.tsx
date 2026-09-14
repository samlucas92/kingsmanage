import { useRef, useState } from "react";

import type { Player } from "../../stores/players";
import type {
	BulkUpdateClubEventAvailabilityRequest,
	ClubEventAvailabilityStatus,
} from "../../types/events";
import {
	parseAttendanceImportCsv,
	type AttendanceImportMatchKind,
	type AttendanceImportParseResult,
} from "./attendanceImportCsv";

type EventAttendanceImportModalProps = {
	isOpen: boolean;
	eventTitle: string;
	players: Player[];
	onClose: () => void;
	onImport: (request: BulkUpdateClubEventAvailabilityRequest) => Promise<void>;
};

export function EventAttendanceImportModal({
	isOpen,
	eventTitle,
	players,
	onClose,
	onImport,
}: EventAttendanceImportModalProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [fileName, setFileName] = useState("");
	const [parseResult, setParseResult] =
		useState<AttendanceImportParseResult | null>(null);
	const [isImporting, setIsImporting] = useState(false);
	const [importError, setImportError] = useState("");
	const [importedCount, setImportedCount] = useState<number | null>(null);

	if (!isOpen) return null;

	const rows = parseResult?.rows ?? [];
	const selectedRows = rows.filter((row) => row.playerId);
	const duplicatePlayerIds = getDuplicatePlayerIds(
		selectedRows.map((row) => row.playerId)
	);
	const unmatchedCount = rows.length - selectedRows.length;
	const canImport =
		selectedRows.length > 0 &&
		selectedRows.length <= 250 &&
		duplicatePlayerIds.size === 0 &&
		(parseResult?.fileErrors.length ?? 0) === 0 &&
		!isImporting;
	const sortedPlayers = [...players].sort((first, second) =>
		first.name.localeCompare(second.name)
	);

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
			setParseResult(parseAttendanceImportCsv(await file.text(), players));
		} catch {
			setParseResult({
				rows: [],
				fileErrors: ["The CSV file could not be read."],
			});
		}
	}

	function updatePlayerMatch(rowNumber: number, playerId: string) {
		const player = players.find((item) => item.id === playerId);
		setParseResult((current) =>
			current
				? {
						...current,
						rows: current.rows.map((row) =>
							row.rowNumber === rowNumber
								? {
										...row,
										playerId: player?.id ?? "",
										playerName: player?.name ?? "",
										matchScore: player ? 1 : 0,
										matchKind: player ? "manual" : "unmatched",
									}
								: row
						),
					}
				: current
		);
	}

	async function handleImport() {
		if (!canImport) return;
		setIsImporting(true);
		setImportError("");

		try {
			await onImport({
				responses: selectedRows.map((row) => ({
					playerId: row.playerId,
					status: row.status,
				})),
			});
			setImportedCount(selectedRows.length);
		} catch (error) {
			setImportError(
				error instanceof Error
					? error.message
					: "The attendance responses could not be imported."
			);
		} finally {
			setIsImporting(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-yepset-950/55 p-3 backdrop-blur-sm sm:p-5">
			<div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_24px_80px_rgba(8,42,40,.24)] sm:max-h-[calc(100vh-2.5rem)]">
				<header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
					<div>
						<p className="text-xs font-bold uppercase tracking-wide text-yepset-700">
							Event attendance import
						</p>
						<h2 className="mt-1 text-xl font-black tracking-[-.02em] text-slate-950">
							Import responses from CSV
						</h2>
						<p className="mt-1 text-sm text-slate-600">
							Review name matches before updating {eventTitle}.
						</p>
					</div>
					<button
						type="button"
						onClick={resetAndClose}
						disabled={isImporting}
						className="rounded-lg p-2 text-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50"
						aria-label="Close attendance import"
					>
						×
					</button>
				</header>

				<div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
					{importedCount !== null ? (
						<div className="mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
							<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-2xl font-black text-white">
								✓
							</div>
							<h3 className="mt-4 text-xl font-black text-emerald-950">
								Attendance updated
							</h3>
							<p className="mt-2 text-sm text-emerald-900">
								{importedCount} player {importedCount === 1 ? "response was" : "responses were"} imported.
							</p>
						</div>
					) : (
						<div className="space-y-5">
							<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
								<input
									ref={fileInputRef}
									type="file"
									accept=".csv,text/csv"
									className="hidden"
									onChange={(event) => void handleFile(event.target.files?.[0])}
								/>
								<p className="font-bold text-slate-900">Choose attendance CSV</p>
								<p className="mt-1 text-sm text-slate-600">
									Supports exports containing Going, Unanswered and Can&apos;t go sections. Guardian-only rows are ignored.
								</p>
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="mt-4 rounded-xl bg-yepset-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-yepset-800"
								>
									{fileName ? "Choose another file" : "Choose CSV file"}
								</button>
								{fileName && (
									<p className="mt-3 text-sm font-semibold text-slate-700">{fileName}</p>
								)}
							</div>

							{parseResult?.fileErrors.map((error) => (
								<div key={error} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
									{error}
								</div>
							))}

							{rows.length > 250 && (
								<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
									This file has {rows.length} player rows. Import up to 250 at a time.
								</div>
							)}

							{rows.length > 0 && (
								<section>
									<div className="mb-3 flex flex-wrap items-end justify-between gap-3">
										<div>
											<h3 className="font-black text-slate-900">Review player matches</h3>
											<p className="text-sm text-slate-600">
												{selectedRows.length} matched · {unmatchedCount} skipped
											</p>
										</div>
										<div className="flex flex-wrap gap-2 text-xs font-bold">
											<CountPill label="Going" count={countStatus(rows, "Available")} tone="success" />
											<CountPill label="Unanswered" count={countStatus(rows, "Unanswered")} tone="neutral" />
											<CountPill label="Can't go" count={countStatus(rows, "Declined")} tone="danger" />
										</div>
									</div>

									{duplicatePlayerIds.size > 0 && (
										<div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
											A player has been matched more than once. Change or skip the highlighted duplicate before importing.
										</div>
									)}

									<div className="max-h-[28rem] overflow-auto rounded-xl border border-slate-200">
										<table className="w-full min-w-[720px] text-left text-sm">
											<thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
												<tr>
													<th className="px-3 py-2">CSV name</th>
													<th className="px-3 py-2">Response</th>
													<th className="px-3 py-2">Matched player</th>
													<th className="px-3 py-2">Match</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-slate-200">
												{rows.map((row) => {
													const isDuplicate = duplicatePlayerIds.has(row.playerId);
													return (
														<tr key={row.rowNumber} className={isDuplicate ? "bg-red-50" : "bg-white"}>
															<td className="px-3 py-3 font-bold text-slate-900">{row.sourceName}</td>
															<td className="px-3 py-3"><StatusPill status={row.status} /></td>
															<td className="px-3 py-3">
																<select
																	value={row.playerId}
																	onChange={(event) => updatePlayerMatch(row.rowNumber, event.target.value)}
																	className={`w-full rounded-lg border px-3 py-2 ${isDuplicate ? "border-red-300" : "border-slate-300"}`}
																>
																	<option value="">Skip — no player match</option>
																	{sortedPlayers.map((player) => (
																		<option key={player.id} value={player.id}>{player.name}</option>
																	))}
																</select>
															</td>
															<td className="px-3 py-3"><MatchPill kind={row.matchKind} /></td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								</section>
							)}

							{importError && (
								<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{importError}</div>
							)}
						</div>
					)}
				</div>

				<footer className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
					{importedCount !== null ? (
						<button type="button" onClick={resetAndClose} className="rounded-xl bg-yepset-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-yepset-800">Done</button>
					) : (
						<>
							<button type="button" onClick={resetAndClose} disabled={isImporting} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-50">Cancel</button>
							<button type="button" onClick={() => void handleImport()} disabled={!canImport} className="rounded-xl bg-yepset-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-yepset-800 disabled:cursor-not-allowed disabled:bg-slate-300">
								{isImporting ? "Importing…" : `Import ${selectedRows.length || ""} responses`}
							</button>
						</>
					)}
				</footer>
			</div>
		</div>
	);
}

function getDuplicatePlayerIds(playerIds: string[]) {
	const seen = new Set<string>();
	const duplicates = new Set<string>();
	for (const playerId of playerIds) {
		if (seen.has(playerId)) duplicates.add(playerId);
		seen.add(playerId);
	}
	return duplicates;
}

function countStatus(
	rows: AttendanceImportParseResult["rows"],
	status: ClubEventAvailabilityStatus
) {
	return rows.filter((row) => row.status === status).length;
}

function CountPill({
	label,
	count,
	tone,
}: {
	label: string;
	count: number;
	tone: "success" | "neutral" | "danger";
}) {
	const classes = tone === "success"
		? "bg-emerald-100 text-emerald-800"
		: tone === "danger"
			? "bg-red-100 text-red-800"
			: "bg-slate-100 text-slate-700";
	return <span className={`rounded-full px-3 py-1 ${classes}`}>{label} {count}</span>;
}

function StatusPill({ status }: { status: ClubEventAvailabilityStatus }) {
	const label = status === "Available" ? "Going" : status === "Declined" ? "Can't go" : "Unanswered";
	const classes = status === "Available"
		? "bg-emerald-100 text-emerald-800"
		: status === "Declined"
			? "bg-red-100 text-red-800"
			: "bg-slate-100 text-slate-700";
	return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${classes}`}>{label}</span>;
}

function MatchPill({ kind }: { kind: AttendanceImportMatchKind }) {
	const labels: Record<AttendanceImportMatchKind, string> = {
		exact: "Exact",
		strong: "Strong",
		review: "Review",
		manual: "Manual",
		unmatched: "Unmatched",
	};
	const classes = kind === "exact" || kind === "strong" || kind === "manual"
		? "bg-emerald-100 text-emerald-800"
		: kind === "review"
			? "bg-amber-100 text-amber-800"
			: "bg-slate-100 text-slate-600";
	return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${classes}`}>{labels[kind]}</span>;
}
