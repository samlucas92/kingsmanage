import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { socialInsightsApi } from "../../services/socialInsightsApi";
import type {
	SocialAccountInsights,
	SocialInsightsOverview,
	SocialPlatform,
	SocialPostInsightsDetail,
	SocialPostInsightsSummary,
} from "../../types/integrations";

type PlatformFilter = "All" | SocialPlatform;

const metricLabels: Record<string, string> = {
	post_impressions: "Impressions",
	post_impressions_unique: "Reach",
	post_engaged_users: "Engaged users",
	post_clicks: "Post clicks",
	views: "Views",
	reach: "Reach",
	likes: "Likes",
	comments: "Comments",
	shares: "Shares",
	saved: "Saves",
	total_interactions: "Total interactions",
};

export default function SocialInsights() {
	const navigate = useNavigate();
	const { platform, postId } = useParams();
	const selectedPlatform = isSocialPlatform(platform) ? platform : null;
	const [overview, setOverview] = useState<SocialInsightsOverview | null>(null);
	const [detail, setDetail] = useState<SocialPostInsightsDetail | null>(null);
	const [filter, setFilter] = useState<PlatformFilter>("All");
	const [search, setSearch] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [error, setError] = useState("");
	const [detailError, setDetailError] = useState<{ key: string; message: string } | null>(null);
	const selectedPostKey = selectedPlatform && postId ? `${selectedPlatform}:${postId}` : "";

	useEffect(() => {
		void loadOverview();
	}, []);

	useEffect(() => {
		if (!selectedPlatform || !postId) return;
		let cancelled = false;
		void socialInsightsApi.getPost(selectedPlatform, postId)
			.then((result) => { if (!cancelled) setDetail(result); })
			.catch((loadError) => {
				if (!cancelled) setDetailError({
					key: `${selectedPlatform}:${postId}`,
					message: loadError instanceof Error ? loadError.message : "The post insights could not be loaded.",
				});
			});
		return () => { cancelled = true; };
	}, [selectedPlatform, postId]);

	async function loadOverview(refresh = false) {
		try {
			if (refresh) setIsRefreshing(true);
			else setIsLoading(true);
			setError("");
			setOverview(await socialInsightsApi.getOverview(refresh));
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : "Meta insights could not be loaded.");
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	}

	const posts = useMemo(() => {
		const query = search.trim().toLocaleLowerCase();
		return (overview?.posts ?? []).filter((post) =>
			(filter === "All" || post.platform === filter) &&
			(!query || post.caption.toLocaleLowerCase().includes(query))
		);
	}, [filter, overview?.posts, search]);

	if (selectedPlatform && postId) {
		const detailMatchesRoute = detail?.platform === selectedPlatform && detail.id === postId;
		const currentDetailError = detailError?.key === selectedPostKey ? detailError.message : "";
		return <PostDetail
			post={detailMatchesRoute ? detail : null}
			isLoading={!detailMatchesRoute && !currentDetailError}
			error={currentDetailError}
			onBack={() => navigate("/social-media/insights")}
		/>;
	}

	return (
		<div className="space-y-5">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<Link to="/social-media" className="text-sm font-bold text-yepset-700 hover:text-yepset-900">← Social Media Studio</Link>
					<h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Meta insights</h1>
					<p className="mt-1 text-sm text-slate-600">See how your club's Facebook and Instagram posts are performing.</p>
				</div>
				<button type="button" onClick={() => void loadOverview(true)} disabled={isRefreshing} className="btn-secondary w-fit disabled:opacity-50">
					{isRefreshing ? "Refreshing…" : "Refresh insights"}
				</button>
			</header>

			{error && <ErrorState message={error} onRetry={() => void loadOverview()} showReconnect={needsReconnect(error)} />}
			{isLoading && <LoadingState label="Loading Meta insights…" />}

			{!isLoading && !error && overview && (
				<>
					<section className="grid gap-3 sm:grid-cols-2">
						{overview.accounts.map((account) => <AccountCard key={account.platform} account={account} />)}
					</section>

					<section className="surface-card overflow-hidden">
						<div className="border-b border-slate-200 p-4 sm:p-5">
							<div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
								<div>
									<h2 className="text-lg font-black text-slate-950">Posts</h2>
									<p className="mt-0.5 text-xs font-semibold text-slate-500">Latest 50 posts per connected channel · updated {formatDateTime(overview.generatedAt)}</p>
								</div>
								<div className="flex flex-col gap-2 sm:flex-row">
									<div className="flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Filter posts by platform">
										{(["All", "Facebook", "Instagram"] as PlatformFilter[]).map((value) => (
											<button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${filter === value ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>{value}</button>
										))}
									</div>
									<label className="relative block">
										<span className="sr-only">Search post captions</span>
										<SearchIcon />
										<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search posts" className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-yepset-500 focus:ring-2 focus:ring-yepset-100 sm:w-56" />
									</label>
								</div>
							</div>
						</div>

						{posts.length > 0 ? (
							<div className="divide-y divide-slate-100">
								{posts.map((post) => <PostRow key={`${post.platform}-${post.id}`} post={post} />)}
							</div>
						) : (
							<div className="px-5 py-14 text-center">
								<p className="font-bold text-slate-800">No posts match this view</p>
								<p className="mt-1 text-sm text-slate-500">Try another platform or clear the caption search.</p>
							</div>
						)}
					</section>
				</>
			)}
		</div>
	);
}

function AccountCard({ account }: { account: SocialAccountInsights }) {
	return (
		<div className="surface-card grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 overflow-hidden p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-4 sm:p-5">
			<PlatformMark platform={account.platform} large />
			<div className="min-w-0">
				<p className="text-xs font-black uppercase tracking-[.14em] text-slate-500">{account.platform}</p>
				<p className="truncate text-lg font-black text-slate-950">{account.username ? `@${account.username}` : account.name}</p>
			</div>
			<div className="col-span-2 flex min-w-0 items-end justify-between border-t border-slate-100 pt-3 text-left sm:col-span-1 sm:block sm:border-0 sm:pt-0 sm:text-right">
				<div><p className="text-2xl font-black tabular-nums text-slate-950">{formatNumber(account.followerCount)}</p><p className="text-xs font-bold text-slate-500">followers</p></div>
				{account.postCount != null && <p className="pb-0.5 text-xs font-semibold text-slate-400 sm:mt-1 sm:pb-0">{formatNumber(account.postCount)} posts</p>}
			</div>
		</div>
	);
}

function PostRow({ post }: { post: SocialPostInsightsSummary }) {
	return (
		<Link to={`/social-media/insights/${post.platform}/${encodeURIComponent(post.id)}`} className="group grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 p-4 transition hover:bg-slate-50 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:items-center sm:px-5">
			<PostThumbnail post={post} />
			<div className="min-w-0">
				<div className="flex items-center gap-2"><PlatformMark platform={post.platform} /><span className="text-xs font-bold text-slate-500">{formatDate(post.createdAt)}</span></div>
				<p className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-slate-900">{post.caption || `${post.platform} post`}</p>
				<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500 sm:hidden">
					<MetricInline label="Likes" value={post.likeCount} />
					<MetricInline label="Comments" value={post.commentCount} />
					<MetricInline label="Shares" value={post.shareCount} />
				</div>
			</div>
			<div className="col-span-2 hidden items-center gap-6 sm:col-span-1 sm:flex">
				<MetricCompact label="Likes" value={post.likeCount} />
				<MetricCompact label="Comments" value={post.commentCount} />
				<MetricCompact label="Shares" value={post.shareCount} />
				<span className="text-2xl text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600">›</span>
			</div>
		</Link>
	);
}

function PostDetail({ post, isLoading, error, onBack }: { post: SocialPostInsightsDetail | null; isLoading: boolean; error: string; onBack: () => void }) {
	if (isLoading) return <div className="space-y-4"><button type="button" onClick={onBack} className="text-sm font-bold text-yepset-700">← All posts</button><LoadingState label="Loading post insights…" /></div>;
	if (error || !post) return <div className="space-y-4"><button type="button" onClick={onBack} className="text-sm font-bold text-yepset-700">← All posts</button><ErrorState message={error || "This post is unavailable."} onRetry={() => window.location.reload()} /></div>;

	const metrics = Object.entries(post.metrics);
	return (
		<div className="space-y-5">
			<header>
				<button type="button" onClick={onBack} className="text-sm font-bold text-yepset-700 hover:text-yepset-900">← All posts</button>
				<div className="mt-3 flex items-center gap-2"><PlatformMark platform={post.platform} /><span className="text-sm font-bold text-slate-500">{post.platform} · {formatDate(post.createdAt)}</span></div>
				<h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Post performance</h1>
			</header>

			<div className="grid gap-5 lg:grid-cols-[minmax(18rem,.72fr)_minmax(0,1.28fr)]">
				<section className="surface-card h-fit overflow-hidden">
					{post.thumbnailUrl && <img src={post.thumbnailUrl} alt="" className="aspect-square w-full bg-slate-100 object-cover" />}
					<div className="p-5">
						<p className="whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-800">{post.caption || `${post.platform} post`}</p>
						{post.permalink && <a href={post.permalink} target="_blank" rel="noreferrer" className="btn-secondary mt-4 inline-flex">Open on {post.platform} ↗</a>}
					</div>
				</section>

				<section className="space-y-4">
					<div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
						{metrics.map(([name, value]) => <MetricCard key={name} label={metricLabels[name] ?? humanize(name)} value={value} />)}
						{metrics.length === 0 && <div className="col-span-full rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-900">Meta did not return detailed metrics for this post. Newly published posts can take time to populate, and some metrics vary by post type or account eligibility.</div>}
					</div>
					<div className="surface-card p-5">
						<h2 className="font-black text-slate-950">Visible engagement</h2>
						<div className="mt-4 grid grid-cols-3 gap-3">
							<MetricCompact label="Likes" value={post.likeCount} prominent />
							<MetricCompact label="Comments" value={post.commentCount} prominent />
							<MetricCompact label="Shares" value={post.shareCount} prominent />
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}

function MetricCard({ label, value }: { label: string; value: number }) {
	return <div className="surface-card p-4 sm:p-5"><p className="text-2xl font-black tabular-nums text-slate-950 sm:text-3xl">{formatNumber(value)}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p></div>;
}

function MetricCompact({ label, value, prominent = false }: { label: string; value?: number | null; prominent?: boolean }) {
	return <div className={prominent ? "text-center" : "min-w-[3.5rem] text-right"}><p className={`${prominent ? "text-xl" : "text-sm"} font-black tabular-nums text-slate-900`}>{formatNumber(value)}</p><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p></div>;
}

function MetricInline({ label, value }: { label: string; value?: number | null }) {
	if (value == null) return null;
	return <span>{formatNumber(value)} {label.toLocaleLowerCase()}</span>;
}

function PostThumbnail({ post }: { post: SocialPostInsightsSummary }) {
	return post.thumbnailUrl
		? <img src={post.thumbnailUrl} alt="" loading="lazy" className="aspect-square w-full rounded-xl bg-slate-100 object-cover" />
		: <div className="grid aspect-square w-full place-items-center rounded-xl bg-slate-100 text-slate-400"><PlatformMark platform={post.platform} large /></div>;
}

function PlatformMark({ platform, large = false }: { platform: SocialPlatform; large?: boolean }) {
	return <span aria-label={platform} title={platform} className={`grid shrink-0 place-items-center rounded-lg font-black text-white ${large ? "h-12 w-12 text-xl" : "h-6 w-6 text-xs"} ${platform === "Facebook" ? "bg-[#0866ff]" : "bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045]"}`}>{platform === "Facebook" ? "f" : "◎"}</span>;
}

function LoadingState({ label }: { label: string }) {
	return <div className="surface-card grid min-h-56 place-items-center p-8 text-center"><div><span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-yepset-700" /><p className="mt-3 text-sm font-bold text-slate-600">{label}</p></div></div>;
}

function ErrorState({ message, onRetry, showReconnect = false }: { message: string; onRetry: () => void; showReconnect?: boolean }) {
	return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5"><p className="font-black text-rose-900">Insights unavailable</p><p className="mt-1 text-sm leading-6 text-rose-800">{message}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={onRetry} className="btn-secondary">Try again</button>{showReconnect && <Link to="/organization/integrations" className="btn-primary">Reconnect Meta</Link>}</div></div>;
}

function needsReconnect(message: string) {
	return /pages_read_user_content|reconnect meta|page public content access|\(#10\)/i.test(message);
}

function SearchIcon() {
	return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
}

function isSocialPlatform(value?: string): value is SocialPlatform {
	return value === "Facebook" || value === "Instagram";
}

function formatNumber(value?: number | null) {
	return value == null ? "—" : new Intl.NumberFormat(undefined, { notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function formatDate(value: string) {
	return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value: string) {
	return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function humanize(value: string) {
	return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
