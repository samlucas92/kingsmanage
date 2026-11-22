import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { chooseGoogleSpreadsheet } from "../../services/googlePicker";
import { integrationsApi } from "../../services/integrationsApi";
import type { GoogleSheetsIntegration } from "../../types/integrations";

const emptyIntegration: GoogleSheetsIntegration = {
	isConfigured: false,
	status: "NotConfigured",
	sheets: [],
};

export default function GoogleSheetsIntegrationCard() {
	const [integration, setIntegration] = useState(emptyIntegration);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		integrationsApi.getGoogleSheets()
			.then(setIntegration)
			.catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Google Sheets connection could not be loaded."))
			.finally(() => setIsLoading(false));
	}, []);

	async function connect() {
		try {
			setError("");
			const { authorizationUrl } = await integrationsApi.startGoogleSheetsConnection();
			window.location.assign(authorizationUrl);
		} catch (connectError) {
			setError(connectError instanceof Error ? connectError.message : "Google connection could not be started.");
		}
	}

	async function chooseSpreadsheet() {
		try {
			setIsSaving(true); setError(""); setMessage("");
			const pickerToken = await integrationsApi.getGooglePickerToken();
			const spreadsheetId = await chooseGoogleSpreadsheet(pickerToken);
			if (!spreadsheetId) return;
			const updated = await integrationsApi.selectGoogleSpreadsheet(spreadsheetId);
			setIntegration(updated);
			setMessage(`${updated.spreadsheetName ?? "Google Sheet"} is now available inside Yepset.`);
		} catch (selectionError) {
			setError(selectionError instanceof Error ? selectionError.message : "The spreadsheet could not be selected.");
		} finally {
			setIsSaving(false);
		}
	}

	async function validate() {
		try {
			setIsSaving(true); setError("");
			const updated = await integrationsApi.validateGoogleSheets();
			setIntegration(updated);
			if (updated.status === "NeedsAttention") throw new Error(updated.lastError || "Google Sheets needs to be reconnected.");
			setMessage("Google Sheets is connected and readable.");
		} catch (validationError) {
			setError(validationError instanceof Error ? validationError.message : "The Google connection could not be checked.");
		} finally {
			setIsSaving(false);
		}
	}

	async function disconnect() {
		if (!window.confirm("Disconnect Google Sheets and remove its stored credentials? The existing Apps Script export will keep working.")) return;
		try {
			setIsSaving(true); setError("");
			await integrationsApi.disconnectGoogleSheets();
			setIntegration(emptyIntegration);
			setMessage("Google Sheets disconnected. Apps Script export is still available.");
		} catch (disconnectError) {
			setError(disconnectError instanceof Error ? disconnectError.message : "Google Sheets could not be disconnected.");
		} finally {
			setIsSaving(false);
		}
	}

	const status = !integration.isConfigured ? "Not configured" : integration.status === "NeedsAttention" ? "Needs attention" : integration.spreadsheetId ? "Connected" : "Choose workbook";
	const statusClass = status === "Connected" ? "bg-emerald-100 text-emerald-800" : status === "Needs attention" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700";

	return <section className="surface-card overflow-hidden">
		<div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between">
			<div className="flex gap-4">
				<div className="grid h-12 w-12 shrink-0 grid-cols-2 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" aria-hidden="true"><span className="bg-[#0f9d58]"/><span className="bg-[#34a853]"/><span className="bg-[#188038]"/><span className="bg-[#0f9d58]"/></div>
				<div>
					<div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-black text-slate-950">Google Sheets</h2><span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass}`}>{status}</span></div>
					<p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Connect the club stats workbook so coaches can view it without leaving Yepset. Match exports continue to use the existing Apps Script while this connection is tested.</p>
					{integration.connectedGoogleUserEmail && <p className="mt-2 text-xs font-bold text-slate-500">Connected as {integration.connectedGoogleUserEmail}{integration.spreadsheetName ? ` · ${integration.spreadsheetName}` : ""}</p>}
				</div>
			</div>
		</div>
		{message && <div className="mx-5 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</div>}
		{error && <div className="mx-5 mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</div>}
		<div className="flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
			{!integration.isConfigured && <button type="button" onClick={() => void connect()} disabled={isLoading || isSaving} className="btn-primary">Connect Google</button>}
			{integration.isConfigured && <button type="button" onClick={() => void chooseSpreadsheet()} disabled={isSaving} className="btn-primary">{integration.spreadsheetId ? "Change workbook" : "Choose workbook"}</button>}
			{integration.spreadsheetId && <Link to="/stats/google-sheet" className="btn-secondary">View in Yepset</Link>}
			{integration.isConfigured && <button type="button" onClick={() => void validate()} disabled={isSaving} className="btn-secondary">Check connection</button>}
			{integration.isConfigured && <button type="button" onClick={() => void connect()} disabled={isSaving} className="btn-secondary">Reconnect account</button>}
			{integration.isConfigured && <button type="button" onClick={() => void disconnect()} disabled={isSaving} className="btn-secondary text-rose-700">Disconnect</button>}
		</div>
	</section>;
}
