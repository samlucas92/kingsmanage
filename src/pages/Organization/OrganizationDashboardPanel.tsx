import { useEffect, useState } from "react";
import { organizationApi } from "../../services/organizationApi";
import type {
	OrganizationDashboard,
	OrganizationUpcomingItem,
	SportsClub,
} from "../../types/organization";

export function OrganizationDashboardPanel({
	clubs,
}: {
	clubs: SportsClub[];
}) {
	const [clubId, setClubId] = useState("");
	const [result, setResult] = useState<{
		clubId: string;
		dashboard: OrganizationDashboard | null;
		error: string;
	} | null>(null);
	const loading = result?.clubId !== clubId;
	const dashboard = loading ? null : (result?.dashboard ?? null);
	const error = loading ? "" : (result?.error ?? "");

	useEffect(() => {
		let active = true;
		organizationApi
			.getDashboard(clubId || undefined)
			.then((value) => {
				if (active) {
					setResult({ clubId, dashboard: value, error: "" });
				}
			})
			.catch((reason) => {
				if (active) {
					setResult({
						clubId,
						dashboard: null,
						error:
							reason instanceof Error
								? reason.message
								: "Failed to load organization dashboard.",
					});
				}
			});
		return () => {
			active = false;
		};
	}, [clubId]);

	return (
		<section className="surface-card p-5">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-xs font-black uppercase tracking-[.14em] text-yepset-600">
						Organization overview
					</p>
					<h2 className="mt-1 text-xl font-black">Across your clubs</h2>
				</div>
				<label className="text-sm font-semibold text-slate-700">
					Club
					<select
						value={clubId}
						onChange={(event) => setClubId(event.target.value)}
						className="ml-2 rounded-xl border border-slate-300 bg-white px-3 py-2"
					>
						<option value="">All clubs</option>
						{clubs.map((club) => (
							<option key={club.id} value={club.id}>
								{club.name}
							</option>
						))}
					</select>
				</label>
			</div>

			{error && (
				<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
					{error}
				</p>
			)}
			{loading && (
				<p className="mt-4 text-sm text-slate-500">Loading overview...</p>
			)}

			{dashboard && !loading && (
				<>
					<div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
						<Metric label="Clubs" value={dashboard.clubCount} />
						<Metric label="Teams" value={dashboard.teamCount} />
						<Metric label="Users" value={dashboard.userCount} />
						<Metric label="Players" value={dashboard.playerCount} />
						<Metric
							label="Outstanding"
							value={formatCurrency(dashboard.finance.outstanding)}
							attention={dashboard.finance.outstanding > 0}
						/>
					</div>

					<div className="mt-5 grid gap-4 xl:grid-cols-2">
						<UpcomingList
							title="Upcoming fixtures"
							items={dashboard.upcomingFixtures}
						/>
						<UpcomingList
							title="Upcoming events"
							items={dashboard.upcomingEvents}
						/>
					</div>

					<div className="mt-5">
						<h3 className="text-sm font-black uppercase tracking-wide text-slate-600">
							Club attention
						</h3>
						<div className="mt-3 grid gap-3 md:grid-cols-2">
							{dashboard.clubs.map((club) => (
								<article
									key={club.clubId}
									className={`rounded-xl border p-4 ${
										club.attention.length
											? "border-amber-200 bg-amber-50"
											: "border-emerald-200 bg-emerald-50"
									}`}
								>
									<div className="flex items-center justify-between gap-3">
										<h4 className="font-bold">{club.clubName}</h4>
										<span className="text-xs font-semibold text-slate-500">
											{club.teamCount} teams · {club.playerCount} players
										</span>
									</div>
									{club.attention.length ? (
										<ul className="mt-2 list-disc pl-5 text-sm text-amber-800">
											{club.attention.map((message) => (
												<li key={message}>{message}</li>
											))}
										</ul>
									) : (
										<p className="mt-2 text-sm font-semibold text-emerald-700">
											No immediate attention required.
										</p>
									)}
									{club.outstandingFinance > 0 && (
										<p className="mt-2 text-sm font-bold text-red-700">
											{formatCurrency(club.outstandingFinance)} outstanding
										</p>
									)}
								</article>
							))}
						</div>
					</div>
				</>
			)}
		</section>
	);
}

function Metric({
	label,
	value,
	attention = false,
}: {
	label: string;
	value: string | number;
	attention?: boolean;
}) {
	return (
		<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
			<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
				{label}
			</p>
			<p
				className={`mt-1 text-2xl font-black ${
					attention ? "text-red-700" : "text-yepset-800"
				}`}
			>
				{value}
			</p>
		</div>
	);
}

function UpcomingList({
	title,
	items,
}: {
	title: string;
	items: OrganizationUpcomingItem[];
}) {
	return (
		<div className="rounded-xl border border-slate-200 p-4">
			<h3 className="font-bold">{title}</h3>
			<div className="mt-3 space-y-2">
				{items.slice(0, 5).map((item) => (
					<div key={item.id} className="rounded-lg bg-slate-50 px-3 py-2">
						<p className="text-sm font-bold">{item.title}</p>
						<p className="text-xs text-slate-500">
							{item.clubName} · {formatDate(item.startsAt)}
							{item.location ? ` · ${item.location}` : ""}
						</p>
					</div>
				))}
				{items.length === 0 && (
					<p className="text-sm text-slate-500">Nothing upcoming.</p>
				)}
			</div>
		</div>
	);
}

function formatCurrency(value: number) {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: "GBP",
	}).format(value);
}

function formatDate(value: string) {
	return new Date(value).toLocaleString("en-GB", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}
