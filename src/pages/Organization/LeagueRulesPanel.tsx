import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { leagueRulesApi } from "../../services/leagueRulesApi";
import { useClubTeamStore } from "../../stores/clubTeams";
import type { LeagueRule, LeagueRuleType, SaveLeagueRule } from "../../types/leagueRules";

const emptyRule: SaveLeagueRule = {
	name: "",
	isActive: true,
	ruleType: "RecentHigherTeamAppearanceLimit",
	higherTeamId: "",
	restrictedTeamId: "",
	maxPlayers: 3,
	exemptWhenHigherTeamPlaysSameDay: true,
	higherTeamCompetitions: [],
	restrictedTeamCompetitions: [],
};

export default function LeagueRulesPanel() {
	const profiles = useClubTeamStore((state) => state.profiles);
	const loadProfiles = useClubTeamStore((state) => state.loadProfiles);
	const [rules, setRules] = useState<LeagueRule[]>([]);
	const [editing, setEditing] = useState<LeagueRule | null>(null);
	const [isAdding, setIsAdding] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		void loadProfiles();
		leagueRulesApi.getAll().then(setRules).catch((loadError) =>
			setError(loadError instanceof Error ? loadError.message : "Failed to load league rules."));
	}, [loadProfiles]);

	async function save(values: SaveLeagueRule) {
		try {
			const saved = editing
				? await leagueRulesApi.update({ ...editing, ...values })
				: await leagueRulesApi.create(values);
			setRules((current) => [...current.filter((rule) => rule.id !== saved.id), saved]
				.sort((a, b) => a.name.localeCompare(b.name)));
			setEditing(null);
			setIsAdding(false);
			setError("");
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Failed to save league rule.");
			throw saveError;
		}
	}

	async function toggle(rule: LeagueRule) {
		try {
			const saved = await leagueRulesApi.update({ ...rule, isActive: !rule.isActive });
			setRules((current) => current.map((item) => item.id === saved.id ? saved : item));
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Failed to update league rule.");
		}
	}

	const teamName = (id: string) => profiles.find((profile) => profile.id === id)?.displayName ?? "Unknown team";

	return <section className="surface-card p-6">
		<div className="flex flex-wrap items-start justify-between gap-3">
			<div><h2 className="text-xl font-bold">League rules</h2><p className="mt-1 text-sm text-slate-500">Configure selection limits and cup-tied players. Active rules are checked in the match squad selector.</p></div>
			<button type="button" className="btn-primary" onClick={() => { setEditing(null); setIsAdding(true); }}>Add rule</button>
		</div>
		{error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
		<div className="mt-5 space-y-3">
			{rules.map((rule) => <article key={rule.id} className="rounded-xl border border-slate-200 p-4">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{rule.name}</h3><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${rule.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{rule.isActive ? "Active" : "Archived"}</span></div>
						<p className="mt-1 text-sm text-slate-600">{describeRule(rule, teamName)}</p>
						<p className="mt-1 text-xs text-slate-500">Higher-team competitions: {rule.higherTeamCompetitions.join(", ") || "all"} · Restricted competitions: {rule.restrictedTeamCompetitions.join(", ") || "all"}</p>
					</div>
					<div className="flex gap-2"><button type="button" className="btn-secondary" onClick={() => { setEditing(rule); setIsAdding(false); }}>Edit</button><button type="button" className="btn-secondary" onClick={() => void toggle(rule)}>{rule.isActive ? "Archive" : "Restore"}</button></div>
				</div>
			</article>)}
			{rules.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No league rules yet. Add one to start checking squads.</p>}
		</div>
		{(isAdding || editing) && <LeagueRuleModal rule={editing} profiles={profiles} onClose={() => { setEditing(null); setIsAdding(false); }} onSave={save} />}
	</section>;
}

function LeagueRuleModal({ rule, profiles, onClose, onSave }: { rule: LeagueRule | null; profiles: ReturnType<typeof useClubTeamStore.getState>["profiles"]; onClose: () => void; onSave: (values: SaveLeagueRule) => Promise<void> }) {
	const [values, setValues] = useState<SaveLeagueRule>(rule ? { ...rule } : { ...emptyRule, higherTeamId: profiles[0]?.id ?? "", restrictedTeamId: profiles[1]?.id ?? "" });
	const [saving, setSaving] = useState(false);
	const update = <K extends keyof SaveLeagueRule>(key: K, value: SaveLeagueRule[K]) => setValues((current) => ({ ...current, [key]: value }));
	const higherTeam = profiles.find((profile) => profile.id === values.higherTeamId);
	const restrictedTeam = profiles.find((profile) => profile.id === values.restrictedTeamId);
	async function submit(event: FormEvent) {
		event.preventDefault(); setSaving(true);
		try { await onSave({ ...values, maxPlayers: values.ruleType === "CupTied" ? null : values.maxPlayers }); } finally { setSaving(false); }
	}
	return <div className="fixed inset-0 z-50 grid place-items-center bg-yepset-950/55 p-4 backdrop-blur-sm"><form onSubmit={(event) => void submit(event)} className="max-h-[92vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
		<div className="flex justify-between gap-3"><div><h2 className="text-xl font-bold">{rule ? "Edit league rule" : "Add league rule"}</h2><p className="text-sm text-slate-500">Competition names use exact matching, so an FA cup can be excluded from a league cup rule.</p></div><button type="button" onClick={onClose}>✕</button></div>
		<Field label="Rule name"><input required value={values.name} onChange={(event) => update("name", event.target.value)} className="input-field" placeholder="Second-team player limit" /></Field>
		<Field label="Rule type"><select value={values.ruleType} onChange={(event) => update("ruleType", event.target.value as LeagueRuleType)} className="input-field"><option value="RecentHigherTeamAppearanceLimit">Previous higher-team appearance limit</option><option value="CupTied">Cup-tied players</option></select></Field>
		<div className="grid gap-4 sm:grid-cols-2"><Field label="Higher team"><select value={values.higherTeamId} onChange={(event) => setValues((current) => ({ ...current, higherTeamId: event.target.value, higherTeamCompetitions: [] }))} className="input-field">{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}</select></Field><Field label="Restricted team"><select value={values.restrictedTeamId} onChange={(event) => setValues((current) => ({ ...current, restrictedTeamId: event.target.value, restrictedTeamCompetitions: [] }))} className="input-field">{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}</select></Field></div>
		{values.ruleType === "RecentHigherTeamAppearanceLimit" && <><Field label="Maximum affected players"><input required min={0} type="number" value={values.maxPlayers ?? 0} onChange={(event) => update("maxPlayers", Number(event.target.value))} className="input-field" /></Field><label className="flex gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold"><input type="checkbox" checked={values.exemptWhenHigherTeamPlaysSameDay} onChange={(event) => update("exemptWhenHigherTeamPlaysSameDay", event.target.checked)} className="mt-0.5 h-4 w-4" /><span>Exempt when the higher team plays on the same day<span className="block font-normal text-slate-500">The player limit will not apply on those dates.</span></span></label></>}
		<div className="grid gap-4 sm:grid-cols-2">
			<div><p className="text-sm font-semibold text-slate-700">Qualifying higher-team competitions</p><CompetitionDropdown teamName={higherTeam?.displayName ?? "Higher team"} options={higherTeam?.competitions ?? []} selected={values.higherTeamCompetitions} onChange={(selected) => update("higherTeamCompetitions", selected)} /></div>
			<div><p className="text-sm font-semibold text-slate-700">Matches where this rule applies</p><CompetitionDropdown teamName={restrictedTeam?.displayName ?? "Restricted team"} options={restrictedTeam?.competitions ?? []} selected={values.restrictedTeamCompetitions} onChange={(selected) => update("restrictedTeamCompetitions", selected)} /></div>
		</div>
		<div className="flex justify-end gap-2 border-t pt-4"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button disabled={saving || !values.name.trim() || values.higherTeamId === values.restrictedTeamId} className="btn-primary disabled:opacity-50">{saving ? "Saving..." : "Save rule"}</button></div>
	</form></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-sm font-semibold text-slate-700">{label}<span className="mt-1 block">{children}</span></label>; }

function CompetitionDropdown({ teamName, options, selected, onChange }: { teamName: string; options: string[]; selected: string[]; onChange: (selected: string[]) => void }) {
	const available = [...new Set(options.map((option) => option.trim()).filter(Boolean))];
	const selectionLabel = selected.length === 0 ? "All competitions" : selected.join(", ");
	return <>
		<details className="relative mt-1">
			<summary className="input-field flex cursor-pointer list-none items-center justify-between gap-3 text-left font-medium text-slate-800 marker:content-none">
				<span className="truncate">{selectionLabel}</span><span aria-hidden="true" className="text-slate-500">⌄</span>
			</summary>
			<div className="absolute z-20 mt-1 max-h-64 w-full min-w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
				<label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50">
					<input type="checkbox" checked={selected.length === 0} onChange={() => onChange([])} className="h-4 w-4 rounded border-slate-300" />All competitions
				</label>
				{available.map((competition) => <label key={competition} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50">
					<input type="checkbox" checked={selected.includes(competition)} onChange={(event) => onChange(event.target.checked ? [...selected, competition] : selected.filter((item) => item !== competition))} className="h-4 w-4 rounded border-slate-300" />{competition}
				</label>)}
				{available.length === 0 && <p className="px-3 py-2 text-xs font-normal leading-5 text-amber-700">No competitions are configured for {teamName}. Add them under Club teams; this rule will currently apply to all competitions.</p>}
			</div>
		</details>
		<span className="mt-1 block text-xs font-normal text-slate-500">From competitions configured for {teamName}. Choose all or select one or more.</span>
	</>;
}
function describeRule(rule: LeagueRule, teamName: (id: string) => string) {
	if (rule.ruleType === "CupTied") return `Players used by ${teamName(rule.higherTeamId)} are cup-tied for ${teamName(rule.restrictedTeamId)}.`;
	return `${teamName(rule.restrictedTeamId)} can select up to ${rule.maxPlayers ?? 0} players from ${teamName(rule.higherTeamId)}'s previous qualifying game${rule.exemptWhenHigherTeamPlaysSameDay ? ", except when both teams play that day" : ""}.`;
}
