import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import ReportChartContainer from "../../Reports/components/charts/ReportChartContainer";
import ReportLineChart from "../../Reports/components/charts/ReportLineChart";
import { formsApi } from "../../../services/formsApi";
import { useSeasonStore } from "../../../stores/seasons";
import type {
	FormAnalyticsDateRange,
	FormAnalyticsDetail,
	FormAnalyticsOverview,
	FormAnalyticsPerformance,
} from "../../../types/forms";

type DatePreset = "7d" | "30d" | "90d" | "season" | "all" | "custom";
type FormRanking = "views" | "starts" | "submissions" | "completionRate";

export default function FormsAnalyticsPage({ formId }: { formId?: string }) {
	const navigate = useNavigate();
	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);
	const [preset, setPreset] = useState<DatePreset>("30d");
	const [customRange, setCustomRange] = useState<FormAnalyticsDateRange>({});
	const activeSeason = seasons.find((season) => season.id === activeSeasonId);
	const range = useMemo(
		() => buildDateRange(preset, customRange, activeSeason?.startDate, activeSeason?.endDate),
		[preset, customRange, activeSeason?.startDate, activeSeason?.endDate]
	);
	const requestKey = `${formId ?? "overview"}:${range.from ?? ""}:${range.to ?? ""}`;
	const [result, setResult] = useState<{
		key: string;
		overview: FormAnalyticsOverview | null;
		detail: FormAnalyticsDetail | null;
		error: string;
	}>({ key: "", overview: null, detail: null, error: "" });
	const isLoading = result.key !== requestKey;
	const { overview, detail, error } = result;

	useEffect(() => { void loadSeasons(); }, [loadSeasons]);
	useEffect(() => {
		let cancelled = false;
		const request = formId
			? formsApi.getFormAnalytics(formId, range).then((detailResult) => {
				if (!cancelled) setResult({ key: requestKey, overview: null, detail: detailResult, error: "" });
			})
			: formsApi.getAnalyticsOverview(range).then((overviewResult) => {
				if (!cancelled) setResult({ key: requestKey, overview: overviewResult, detail: null, error: "" });
			});
		void request.catch((reason) => {
			if (!cancelled) setResult({
				key: requestKey,
				overview: null,
				detail: null,
				error: reason instanceof Error ? reason.message : "Failed to load form analytics.",
			});
		});
		return () => { cancelled = true; };
	}, [formId, range, requestKey]);

	return (
		<div className="space-y-4 lg:space-y-6">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
				<div>
					{formId && <button type="button" className="mb-2 text-sm font-black text-yepset-700 hover:underline" onClick={() => navigate("/forms/insights")}>← All form insights</button>}
					<p className="text-xs font-black uppercase tracking-[.18em] text-yepset-700">Forms insights</p>
					<h2 className="mt-1 text-2xl font-black tracking-[-.03em] text-slate-950">{detail?.formName ?? "Form performance"}</h2>
					<p className="mt-1 text-sm text-slate-600">See what people view, start, complete, and where they encounter friction.</p>
				</div>
				<AnalyticsDateFilter preset={preset} range={customRange} hasSeason={Boolean(activeSeason)} onPresetChange={setPreset} onRangeChange={setCustomRange} />
			</div>

			{error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
			{isLoading ? (
				<div className="surface-card p-6 text-sm font-semibold text-slate-500">Loading form insights...</div>
			) : formId && detail ? (
				<FormAnalyticsDetailView detail={detail} />
			) : overview ? (
				<FormAnalyticsOverviewView overview={overview} onOpen={(id) => navigate(`/forms/${id}/insights`)} />
			) : null}
		</div>
	);
}

function FormAnalyticsOverviewView({ overview, onOpen }: { overview: FormAnalyticsOverview; onOpen: (id: string) => void }) {
	const [ranking, setRanking] = useState<FormRanking>("views");
	const mostViewed = overview.forms[0];
	const mostStarted = [...overview.forms].sort((a, b) => b.starts - a.starts)[0];
	const reliable = overview.forms.filter((item) => item.starts >= 10);
	const highestCompletion = [...reliable].sort((a, b) => b.completionRate - a.completionRate)[0];
	const mostAbandoned = [...reliable].sort((a, b) => b.abandonmentRate - a.abandonmentRate)[0];
	const rankedForms = [...overview.forms].sort((left, right) => right[ranking] - left[ranking]);
	if (overview.totalViews === 0 && overview.submissions === 0) return <AnalyticsEmptyState />;

	return (
		<>
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
				<Metric label="Total views" value={overview.totalViews} />
				<Metric label="Unique visitors" value={overview.uniqueVisitors} note="Users and anonymous sessions" />
				<Metric label="Forms started" value={overview.starts} />
				<Metric label="Submissions" value={overview.submissions} />
				<Metric label="Completion after starting" value={`${formatPercent(overview.completionRate)}`} emphasis />
			</div>

			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
				<Highlight label="Most viewed" item={mostViewed} value={mostViewed ? `${mostViewed.views} views` : "Not enough data"} />
				<Highlight label="Most started" item={mostStarted} value={mostStarted ? `${mostStarted.starts} starts` : "Not enough data"} />
				<Highlight label="Highest completion" item={highestCompletion} value={highestCompletion ? formatPercent(highestCompletion.completionRate) : "Needs 10 starts"} />
				<Highlight label="Most abandoned" item={mostAbandoned} value={mostAbandoned ? formatPercent(mostAbandoned.abandonmentRate) : "Needs 10 starts"} tone="warning" />
			</div>

			{overview.needsAttention.length > 0 && (
				<section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
					<h3 className="text-sm font-black text-amber-950">Forms needing attention</h3>
					<p className="mt-1 text-xs font-semibold text-amber-800">Based on meaningful traffic, abandonment, start rate, or validation problems.</p>
					<div className="mt-3 grid gap-2 lg:grid-cols-2">
						{overview.needsAttention.map((item) => (
							<button key={item.formId} type="button" onClick={() => onOpen(item.formId)} className="rounded-xl border border-amber-200 bg-white p-3 text-left hover:border-amber-400">
								<p className="font-black text-slate-950">{item.formName}</p>
								<p className="mt-1 text-xs font-semibold text-slate-600">{item.views} views · {item.starts} starts · {item.submissions} submissions</p>
								<p className="mt-1 text-xs font-black text-amber-800">{formatPercent(item.completionRate)} completion after starting</p>
							</button>
						))}
					</div>
				</section>
			)}

			<FormPerformanceList items={rankedForms} ranking={ranking} onRankingChange={setRanking} onOpen={onOpen} />
		</>
	);
}

function FormAnalyticsDetailView({ detail }: { detail: FormAnalyticsDetail }) {
	return (
		<>
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<Metric label="Views" value={detail.views} />
				<Metric label="Unique visitors" value={detail.uniqueVisitors} />
				<Metric label="Started" value={detail.starts} />
				<Metric label="Submitted" value={detail.submissions} />
			</div>
			<div className="grid gap-3 sm:grid-cols-3">
				<Metric label="View-to-start rate" value={formatPercent(detail.viewToStartRate)} />
				<Metric label="Completion after starting" value={formatPercent(detail.completionRate)} emphasis />
				<Metric label="View-to-submission" value={formatPercent(detail.viewConversionRate)} />
			</div>

			<div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
				<section className="surface-card p-4">
					<h3 className="text-sm font-black text-slate-950">Viewed → started → submitted</h3>
					<p className="mt-1 text-xs font-semibold text-slate-500">The funnel shows whether people are deciding not to begin or leaving after they start.</p>
					<div className="mt-5 space-y-3">
						<FunnelStep label="Viewed" value={detail.views} width={100} />
						<FunnelStep label="Started" value={detail.starts} width={detail.views ? detail.starts * 100 / detail.views : 0} note={`${formatPercent(detail.viewToStartRate)} of views`} />
						<FunnelStep label="Submitted" value={detail.submissions} width={detail.views ? detail.submissions * 100 / detail.views : 0} note={`${formatPercent(detail.completionRate)} of starts`} emphasis />
					</div>
				</section>
				<section className="surface-card p-4">
					<h3 className="text-sm font-black text-slate-950">Engaged time</h3>
					<div className="mt-4 grid grid-cols-2 gap-3">
						<SmallMetric label="Average" value={formatDuration(detail.averageEngagedDurationMs)} />
						<SmallMetric label="Median" value={formatDuration(detail.medianEngagedDurationMs)} />
						<SmallMetric label="Completed" value={formatDuration(detail.averageCompletedDurationMs)} />
						<SmallMetric label="Before abandonment" value={formatDuration(detail.averageAbandonedDurationMs)} />
					</div>
				</section>
			</div>

			<ReportChartContainer title="Activity over time" description="Actual form views, meaningful starts, and successful submissions." isEmpty={detail.trends.length < 2}>
				<div className="h-72 min-w-0">
					<ReportLineChart
						ariaLabel="Form views, starts and submissions over time"
						labels={detail.trends.map((item) => new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }))}
						series={[
							{ label: "Views", colour: "#2563eb", values: detail.trends.map((item) => item.views) },
							{ label: "Starts", colour: "#d97706", values: detail.trends.map((item) => item.starts) },
							{ label: "Submissions", colour: "#059669", values: detail.trends.map((item) => item.submissions) },
						]}
					/>
				</div>
			</ReportChartContainer>

			<section className="surface-card overflow-hidden">
				<div className="border-b border-slate-200 p-4">
					<h3 className="text-sm font-black text-slate-950">Field reach and validation</h3>
					<p className="mt-1 text-xs font-semibold text-slate-500">Interactions indicate reach, not an exact abandonment point; optional fields may be skipped intentionally.</p>
				</div>
				{detail.fields.length === 0 ? <p className="p-4 text-sm text-slate-500">No field interaction data yet.</p> : (
					<div className="divide-y divide-slate-100">
						{detail.fields.map((field) => (
							<div key={field.fieldId} className="grid grid-cols-[1fr_auto] gap-3 p-4 sm:grid-cols-[1fr_120px_150px] sm:items-center">
								<div><p className="font-black text-slate-900">{field.fieldName}</p><p className="text-xs font-semibold text-slate-500">{field.isRequired ? "Required" : "Optional"}</p></div>
								<p className="text-right text-sm font-black text-slate-700">{field.interactions}<span className="block text-xs font-semibold text-slate-400">interactions</span></p>
								<p className={`col-span-2 text-sm font-black sm:col-span-1 sm:text-right ${field.validationErrors ? "text-red-700" : "text-slate-500"}`}>{field.validationErrors}<span className="ml-1 text-xs font-semibold">validation errors</span></p>
							</div>
						))}
					</div>
				)}
			</section>
		</>
	);
}

function FormPerformanceList({ items, ranking, onRankingChange, onOpen }: { items: FormAnalyticsPerformance[]; ranking: FormRanking; onRankingChange: (ranking: FormRanking) => void; onOpen: (id: string) => void }) {
	return <section className="surface-card overflow-hidden">
		<div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-black text-slate-950">Form performance</h3><p className="mt-1 text-xs font-semibold text-slate-500">Select a form to see its funnel, timing, trends, and field interactions.</p></div><label className="flex items-center gap-2 text-xs font-black text-slate-500">Rank by<select value={ranking} onChange={(event) => onRankingChange(event.target.value as FormRanking)} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-bold text-slate-800"><option value="views">Views</option><option value="starts">Starts</option><option value="submissions">Submissions</option><option value="completionRate">Completion rate</option></select></label></div>
		<div className="divide-y divide-slate-100 lg:hidden">{items.map((item) => <button key={item.formId} type="button" onClick={() => onOpen(item.formId)} className="block w-full p-4 text-left"><p className="font-black text-yepset-800">{item.formName}</p><p className="mt-2 text-sm font-semibold text-slate-600">{item.views} views · {item.starts} starts · {item.submissions} submissions</p><p className="mt-1 text-xs font-black text-slate-500">{formatPercent(item.completionRate)} completion · {formatDuration(item.averageEngagedDurationMs)} avg.</p></button>)}</div>
		<div className="hidden overflow-x-auto lg:block"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Form</th><th className="px-4 py-3">Views</th><th className="px-4 py-3">Visitors</th><th className="px-4 py-3">Starts</th><th className="px-4 py-3">Submissions</th><th className="px-4 py-3">Completion</th><th className="px-4 py-3">Abandonment</th><th className="px-4 py-3">Avg. time</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.formId} className="cursor-pointer hover:bg-slate-50" onClick={() => onOpen(item.formId)}><td className="px-4 py-3 font-black text-yepset-800">{item.formName}</td><td className="px-4 py-3">{item.views}</td><td className="px-4 py-3">{item.uniqueVisitors}</td><td className="px-4 py-3">{item.starts}</td><td className="px-4 py-3">{item.submissions}</td><td className="px-4 py-3 font-black text-green-700">{formatPercent(item.completionRate)}</td><td className="px-4 py-3 font-black text-amber-700">{formatPercent(item.abandonmentRate)}</td><td className="px-4 py-3">{formatDuration(item.averageEngagedDurationMs)}</td></tr>)}</tbody></table></div>
	</section>;
}

function AnalyticsDateFilter({ preset, range, hasSeason, onPresetChange, onRangeChange }: { preset: DatePreset; range: FormAnalyticsDateRange; hasSeason: boolean; onPresetChange: (preset: DatePreset) => void; onRangeChange: (range: FormAnalyticsDateRange) => void }) {
	return <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><select value={preset} onChange={(event) => onPresetChange(event.target.value as DatePreset)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold"><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option>{hasSeason && <option value="season">This season</option>}<option value="all">All time</option><option value="custom">Custom</option></select>{preset === "custom" && <div className="flex gap-2"><input aria-label="Analytics from date" type="date" value={range.from ?? ""} onChange={(event) => onRangeChange({ ...range, from: event.target.value })} className="min-w-0 rounded-xl border border-slate-300 px-2 py-2 text-sm"/><input aria-label="Analytics to date" type="date" value={range.to ?? ""} onChange={(event) => onRangeChange({ ...range, to: event.target.value })} className="min-w-0 rounded-xl border border-slate-300 px-2 py-2 text-sm"/></div>}</div>;
}

function Metric({ label, value, note, emphasis }: { label: string; value: string | number; note?: string; emphasis?: boolean }) { return <div className={`rounded-2xl border p-4 ${emphasis ? "border-yepset-200 bg-yepset-50" : "border-slate-200 bg-white"}`}><p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-2 text-2xl font-black ${emphasis ? "text-yepset-800" : "text-slate-950"}`}>{value}</p>{note && <p className="mt-1 text-[11px] font-semibold text-slate-500">{note}</p>}</div>; }
function SmallMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-lg font-black text-slate-950">{value}</p></div>; }
function Highlight({ label, item, value, tone = "default" }: { label: string; item?: FormAnalyticsPerformance; value: string; tone?: "default" | "warning" }) { return <div className={`rounded-2xl border p-4 ${tone === "warning" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}><p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 truncate font-black text-slate-950">{item?.formName ?? "No qualifying form"}</p><p className={`mt-1 text-sm font-black ${tone === "warning" ? "text-amber-800" : "text-yepset-700"}`}>{value}</p></div>; }
function FunnelStep({ label, value, width, note, emphasis }: { label: string; value: number; width: number; note?: string; emphasis?: boolean }) { return <div><div className="mb-1 flex items-end justify-between gap-3"><p className="text-sm font-black text-slate-800">{label} <span className="text-lg text-slate-950">{value}</span></p>{note && <p className="text-xs font-bold text-slate-500">{note}</p>}</div><div className="h-9 rounded-lg bg-slate-100"><div className={`flex h-full min-w-2 items-center rounded-lg ${emphasis ? "bg-yepset-600" : "bg-kick-400"}`} style={{ width: `${Math.max(1, Math.min(100, width))}%` }} /></div></div>; }
function AnalyticsEmptyState() { return <div className="surface-card p-8 text-center"><p className="text-lg font-black text-slate-950">No form activity yet</p><p className="mt-2 text-sm text-slate-500">Analytics will appear once people start viewing your forms.</p></div>; }
function formatPercent(value: number) { return `${Math.round(value)}%`; }
function formatDuration(milliseconds: number) { if (!milliseconds) return "—"; const seconds = Math.round(milliseconds / 1000); return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`; }
function buildDateRange(preset: DatePreset, custom: FormAnalyticsDateRange, seasonStart?: string, seasonEnd?: string): FormAnalyticsDateRange { if (preset === "all") return {}; if (preset === "custom") return { from: custom.from ? `${custom.from}T00:00:00.000Z` : undefined, to: custom.to ? `${custom.to}T23:59:59.999Z` : undefined }; if (preset === "season" && seasonStart) return { from: seasonStart, to: seasonEnd ? `${seasonEnd.slice(0, 10)}T23:59:59.999Z` : undefined }; const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30; const from = new Date(); from.setUTCDate(from.getUTCDate() - days); return { from: from.toISOString(), to: new Date().toISOString() }; }
