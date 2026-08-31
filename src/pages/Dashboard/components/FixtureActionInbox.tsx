import { Link } from "react-router-dom";

import type { Match } from "../../../stores/match";
import type { ClubEvent } from "../../../types/events";
import { getFixtureActions } from "../../../utils/fixtureWorkflow";

export default function FixtureActionInbox({ matches, events }: { matches: Match[]; events: ClubEvent[] }) {
	const actions = getFixtureActions(matches, events).slice(0, 5);

	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="text-lg font-black text-slate-950">Needs attention</h2>
					<p className="mt-1 text-sm text-slate-500">Fixture issues that have a clear next action.</p>
				</div>
				<Link to="/calendar" className="shrink-0 text-sm font-bold text-yepset-700 hover:text-yepset-900">Calendar →</Link>
			</div>

			{actions.length === 0 ? (
				<div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-800">Fixtures are up to date. No action is needed.</div>
			) : (
				<div className="mt-4 divide-y divide-slate-100">
					{actions.map((action) => (
						<Link key={action.id} to={action.to} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
							<span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${action.tone === "critical" ? "bg-red-500" : "bg-amber-400"}`} />
							<span className="min-w-0 flex-1">
								<span className="block text-sm font-black text-slate-900">{action.title}</span>
								<span className="mt-0.5 block text-xs font-medium text-slate-500">{action.detail}</span>
							</span>
							<span className="text-lg text-slate-400">›</span>
						</Link>
					))}
				</div>
			)}
		</section>
	);
}
