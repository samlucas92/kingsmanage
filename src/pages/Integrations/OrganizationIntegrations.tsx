import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import OrganizationAdminNav from "../../components/organization/OrganizationAdminNav";
import { integrationsApi } from "../../services/integrationsApi";
import { organizationApi } from "../../services/organizationApi";
import type { MetaIntegration, SocialChannelMapping } from "../../types/integrations";
import type { SportsClub } from "../../types/organization";

const emptyIntegration: MetaIntegration = {
	isConfigured: false,
	isEnabled: false,
	status: "NotConfigured",
	timeZoneId: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London",
	pages: [],
	clubMappings: [],
};

export default function OrganizationIntegrations() {
	const [searchParams, setSearchParams] = useSearchParams();
	const initialSearch = useRef({
		configure: searchParams.get("configure"),
		connected: searchParams.get("connected"),
	});
	const [integration, setIntegration] = useState<MetaIntegration>(emptyIntegration);
	const [clubs, setClubs] = useState<SportsClub[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [wizardStep, setWizardStep] = useState(0);
	const [mappings, setMappings] = useState<SocialChannelMapping[]>([]);
	const [timeZoneId, setTimeZoneId] = useState(emptyIntegration.timeZoneId);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [showDisconnect, setShowDisconnect] = useState(false);

	useEffect(() => {
		Promise.all([integrationsApi.getMeta(), organizationApi.getClubs()])
			.then(([loadedIntegration, loadedClubs]) => {
				setIntegration(loadedIntegration);
				setClubs(loadedClubs.filter((club) => club.isActive));
				setMappings(createMappings(loadedClubs, loadedIntegration));
				setTimeZoneId(loadedIntegration.timeZoneId || emptyIntegration.timeZoneId);
				if (initialSearch.current.configure === "meta") setWizardStep(3);
				if (initialSearch.current.connected === "meta") setMessage("Meta connected. Map the Pages you want each club to use.");
			})
			.catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Integrations could not be loaded."))
			.finally(() => setIsLoading(false));
	}, []);

	const configuredClubCount = useMemo(
		() => mappings.filter((mapping) => mapping.facebookEnabled || mapping.instagramEnabled).length,
		[mappings]
	);

	async function startConnection() {
		try {
			setError("");
			const { authorizationUrl } = await integrationsApi.startMetaConnection();
			window.location.assign(authorizationUrl);
		} catch (connectError) {
			setError(connectError instanceof Error ? connectError.message : "Meta connection could not be started.");
		}
	}

	async function setEnabled(isEnabled: boolean) {
		if (isEnabled && !integration.isConfigured) {
			setWizardStep(1);
			return;
		}
		try {
			setIsSaving(true);
			setIntegration(await integrationsApi.setMetaEnabled(isEnabled));
			setMessage(isEnabled ? "Meta publishing enabled." : "Meta publishing paused. Your connection and mappings were kept.");
			setError("");
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "The integration could not be updated.");
		} finally {
			setIsSaving(false);
		}
	}

	async function saveConfiguration() {
		try {
			setIsSaving(true);
			const updated = await integrationsApi.updateMetaConfiguration({ isEnabled: true, timeZoneId, clubMappings: mappings });
			setIntegration(updated);
			setWizardStep(5);
			setError("");
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "The Meta configuration could not be saved.");
		} finally {
			setIsSaving(false);
		}
	}

	async function validateConnection() {
		try {
			setIsSaving(true);
			const validated = await integrationsApi.validateMeta();
			setIntegration(validated);
			if (validated.status === "NeedsAttention") throw new Error(validated.lastError || "Meta needs to be reconnected.");
			setMessage("Meta is connected and ready to publish.");
			setWizardStep(0);
			setSearchParams({}, { replace: true });
			setError("");
		} catch (validateError) {
			setError(validateError instanceof Error ? validateError.message : "The Meta connection could not be validated.");
		} finally {
			setIsSaving(false);
		}
	}

	async function disconnect() {
		try {
			setIsSaving(true);
			await integrationsApi.disconnectMeta();
			setIntegration(emptyIntegration);
			setMappings(createMappings(clubs, emptyIntegration));
			setShowDisconnect(false);
			setMessage("Meta disconnected and its stored credentials removed.");
		} catch (disconnectError) {
			setError(disconnectError instanceof Error ? disconnectError.message : "Meta could not be disconnected.");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div className="space-y-6">
			<OrganizationAdminNav />
			<header>
				<h1 className="text-2xl font-black text-slate-950">Integrations</h1>
				<p className="mt-1 max-w-2xl text-sm text-slate-600">Connect organisation services once, then decide which clubs and workflows may use them.</p>
			</header>

			{message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</div>}
			{error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</div>}

			<section className="surface-card overflow-hidden">
				<div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex gap-4">
						<div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#0866ff] text-xl font-black text-white">f</div>
						<div>
							<div className="flex flex-wrap items-center gap-2">
								<h2 className="text-lg font-black text-slate-950">Meta: Facebook & Instagram</h2>
								<StatusBadge integration={integration} />
							</div>
							<p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Publish Social Media Studio artwork immediately or schedule it for each club's Facebook Page and connected Instagram professional account.</p>
							{integration.connectedMetaUserName && <p className="mt-2 text-xs font-bold text-slate-500">Connected by {integration.connectedMetaUserName} · {configuredClubCount} club{configuredClubCount === 1 ? "" : "s"} mapped</p>}
						</div>
					</div>
					<label className="flex shrink-0 items-center gap-3 text-sm font-black text-slate-700">
						<span>{integration.isEnabled ? "Enabled" : "Disabled"}</span>
						<input type="checkbox" checked={integration.isEnabled} disabled={isLoading || isSaving} onChange={(event) => void setEnabled(event.target.checked)} className="h-5 w-5 accent-yepset-700" />
					</label>
				</div>
				<div className="flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
					<button type="button" onClick={() => setWizardStep(integration.isConfigured ? 3 : 1)} className="btn-primary">{integration.isConfigured ? "Configure" : "Set up"}</button>
					{integration.isConfigured && <button type="button" onClick={() => void validateConnection()} disabled={isSaving} className="btn-secondary">Check connection</button>}
					{integration.isConfigured && <button type="button" onClick={() => setShowDisconnect(true)} className="btn-secondary text-rose-700">Disconnect</button>}
				</div>
			</section>

			{wizardStep > 0 && (
				<MetaSetupModal
					step={wizardStep}
					integration={integration}
					clubs={clubs}
					mappings={mappings}
					timeZoneId={timeZoneId}
					isSaving={isSaving}
					onClose={() => setWizardStep(0)}
					onStep={setWizardStep}
					onConnect={() => void startConnection()}
					onMappings={setMappings}
					onTimeZone={setTimeZoneId}
					onSave={() => void saveConfiguration()}
					onValidate={() => void validateConnection()}
				/>
			)}

			{showDisconnect && <ConfirmDisconnect isSaving={isSaving} onCancel={() => setShowDisconnect(false)} onConfirm={() => void disconnect()} />}
		</div>
	);
}

function MetaSetupModal({ step, integration, clubs, mappings, timeZoneId, isSaving, onClose, onStep, onConnect, onMappings, onTimeZone, onSave, onValidate }: {
	step: number;
	integration: MetaIntegration;
	clubs: SportsClub[];
	mappings: SocialChannelMapping[];
	timeZoneId: string;
	isSaving: boolean;
	onClose: () => void;
	onStep: (step: number) => void;
	onConnect: () => void;
	onMappings: (mappings: SocialChannelMapping[]) => void;
	onTimeZone: (value: string) => void;
	onSave: () => void;
	onValidate: () => void;
}) {
	function updateMapping(clubId: string, patch: Partial<SocialChannelMapping>) {
		onMappings(mappings.map((mapping) => mapping.clubId === clubId ? { ...mapping, ...patch } : mapping));
	}

	return (
		<div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/55 p-0 sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Configure Meta integration">
			<div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl">
				<header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
					<div><p className="text-xs font-black uppercase tracking-wider text-yepset-700">Step {step} of 5</p><h2 className="text-xl font-black text-slate-950">Connect Meta</h2></div>
					<button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-xl text-slate-500 hover:bg-slate-100" aria-label="Close">×</button>
				</header>
				<div className="p-5 sm:p-6">
					{step === 1 && <SetupRequirements />}
					{step === 2 && <ConnectStep isConnected={integration.isConfigured} connectedName={integration.connectedMetaUserName} onConnect={onConnect} />}
					{step === 3 && <ClubMappingStep clubs={clubs} pages={integration.pages} mappings={mappings} onUpdate={updateMapping} />}
					{step === 4 && <DefaultsStep timeZoneId={timeZoneId} onTimeZone={onTimeZone} />}
					{step === 5 && <FinishStep integration={integration} mappings={mappings} />}
				</div>
				<footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-between">
					<button type="button" onClick={() => step === 1 ? onClose() : onStep(step - 1)} className="btn-secondary">{step === 1 ? "Cancel" : "Back"}</button>
					{step === 1 && <button type="button" onClick={() => onStep(2)} className="btn-primary">Continue</button>}
					{step === 2 && (integration.isConfigured ? <button type="button" onClick={() => onStep(3)} className="btn-primary">Choose destinations</button> : <button type="button" onClick={onConnect} className="btn-primary">Continue with Facebook</button>)}
					{step === 3 && <button type="button" onClick={() => onStep(4)} disabled={!mappings.some((item) => item.facebookEnabled || item.instagramEnabled)} className="btn-primary disabled:opacity-50">Continue</button>}
					{step === 4 && <button type="button" onClick={onSave} disabled={isSaving} className="btn-primary">{isSaving ? "Saving…" : "Save and enable"}</button>}
					{step === 5 && <button type="button" onClick={onValidate} disabled={isSaving} className="btn-primary">{isSaving ? "Checking…" : "Check and finish"}</button>}
				</footer>
			</div>
		</div>
	);
}

function SetupRequirements() {
	return <div><h3 className="text-lg font-black text-slate-950">Before you start</h3><p className="mt-2 text-sm leading-6 text-slate-600">Use a Facebook account that has full control of the Pages you want to publish to.</p><ul className="mt-4 space-y-3 text-sm font-semibold text-slate-700"><li>✓ Your Instagram account must be a professional account.</li><li>✓ It must be connected to its Facebook Page.</li><li>✓ Yepset will request publishing permissions only; it never receives your Facebook password.</li></ul></div>;
}

function ConnectStep({ isConnected, connectedName, onConnect }: { isConnected: boolean; connectedName?: string | null; onConnect: () => void }) {
	return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#0866ff] text-2xl font-black text-white">f</div><h3 className="mt-3 text-lg font-black text-slate-950">{isConnected ? `Connected as ${connectedName}` : "Authorize Yepset in Meta"}</h3><p className="mt-2 text-sm text-slate-600">Meta will show the exact Pages and permissions being shared.</p><button type="button" onClick={onConnect} className="btn-secondary mt-4">{isConnected ? "Reconnect or change account" : "Continue with Facebook"}</button></div>;
}

function ClubMappingStep({ clubs, pages, mappings, onUpdate }: { clubs: SportsClub[]; pages: MetaIntegration["pages"]; mappings: SocialChannelMapping[]; onUpdate: (clubId: string, patch: Partial<SocialChannelMapping>) => void }) {
	return <div><h3 className="text-lg font-black text-slate-950">Map club destinations</h3><p className="mt-1 text-sm text-slate-600">Each club can publish only to the destinations selected here.</p><div className="mt-4 space-y-4">{clubs.map((club) => {
		const mapping = mappings.find((item) => item.clubId === club.id)!;
		const page = pages.find((item) => item.id === mapping.facebookPageId);
		return <div key={club.id} className="rounded-2xl border border-slate-200 p-4"><p className="font-black text-slate-950">{club.name}</p><label className="mt-3 block text-xs font-black uppercase tracking-wide text-slate-500">Facebook Page<select value={mapping.facebookPageId ?? ""} onChange={(event) => { const selected = pages.find((item) => item.id === event.target.value); onUpdate(club.id, { facebookPageId: selected?.id ?? null, facebookEnabled: Boolean(selected), instagramAccountId: selected?.instagramAccount?.id ?? null, instagramEnabled: Boolean(selected?.instagramAccount) }); }} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-slate-900"><option value="">Do not publish for this club</option>{pages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{page && <div className="mt-3 grid gap-2 sm:grid-cols-2"><Toggle label={`Facebook · ${page.name}`} checked={mapping.facebookEnabled} onChange={(checked) => onUpdate(club.id, { facebookEnabled: checked })} /><Toggle label={page.instagramAccount ? `Instagram · @${page.instagramAccount.username}` : "No Instagram professional account connected"} checked={mapping.instagramEnabled} disabled={!page.instagramAccount} onChange={(checked) => onUpdate(club.id, { instagramEnabled: checked, instagramAccountId: checked ? page.instagramAccount?.id : null })} /></div>}</div>;
	})}</div></div>;
}

function DefaultsStep({ timeZoneId, onTimeZone }: { timeZoneId: string; onTimeZone: (value: string) => void }) {
	return <div><h3 className="text-lg font-black text-slate-950">Scheduling defaults</h3><p className="mt-1 text-sm text-slate-600">Yepset stores scheduled times in UTC and displays them in this organisation timezone.</p><label className="mt-5 block text-sm font-black text-slate-700">Organisation timezone<input value={timeZoneId} onChange={(event) => onTimeZone(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-semibold" /></label><div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">Disabling the integration pauses future publishing but keeps this connection and its mappings. Disconnecting removes the stored credentials.</div></div>;
}

function FinishStep({ integration, mappings }: { integration: MetaIntegration; mappings: SocialChannelMapping[] }) {
	const destinations = mappings.reduce((total, item) => total + Number(item.facebookEnabled) + Number(item.instagramEnabled), 0);
	return <div className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-700">✓</div><h3 className="mt-4 text-xl font-black text-slate-950">Configuration saved</h3><p className="mt-2 text-sm text-slate-600">{destinations} destination{destinations === 1 ? "" : "s"} ready across {mappings.filter((item) => item.facebookEnabled || item.instagramEnabled).length} club{mappings.length === 1 ? "" : "s"}. One final check will confirm the access token is still valid.</p>{integration.lastError && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{integration.lastError}</p>}</div>;
}

function Toggle({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
	return <label className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm font-bold ${disabled ? "border-slate-200 bg-slate-50 text-slate-400" : "border-slate-200 text-slate-700"}`}>{label}<input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-yepset-700" /></label>;
}

function ConfirmDisconnect({ isSaving, onCancel, onConfirm }: { isSaving: boolean; onCancel: () => void; onConfirm: () => void }) {
	return <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/55 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-black text-slate-950">Disconnect Meta?</h2><p className="mt-2 text-sm leading-6 text-slate-600">This removes encrypted Meta credentials and stops scheduled posts. Existing Facebook and Instagram posts are not deleted.</p><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className="btn-secondary">Keep connected</button><button type="button" onClick={onConfirm} disabled={isSaving} className="btn-primary bg-rose-700 hover:bg-rose-800">{isSaving ? "Disconnecting…" : "Disconnect"}</button></div></div></div>;
}

function StatusBadge({ integration }: { integration: MetaIntegration }) {
	const status = !integration.isConfigured ? "Not configured" : integration.status === "NeedsAttention" ? "Needs attention" : integration.isEnabled ? "Connected" : "Disabled";
	const classes = status === "Connected" ? "bg-emerald-100 text-emerald-800" : status === "Needs attention" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700";
	return <span className={`rounded-full px-2.5 py-1 text-xs font-black ${classes}`}>{status}</span>;
}

function createMappings(clubs: SportsClub[], integration: MetaIntegration) {
	return clubs.filter((club) => club.isActive).map((club) => integration.clubMappings.find((item) => item.clubId === club.id) ?? {
		clubId: club.id,
		facebookEnabled: false,
		facebookPageId: null,
		instagramEnabled: false,
		instagramAccountId: null,
	});
}
