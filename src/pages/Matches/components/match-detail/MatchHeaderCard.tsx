import type { MatchState } from "../../../../stores/match";
import { formatDisplayDateTime } from "../../../../utils/date";

interface MatchHeaderCardProps {
	opponent: string;
	date: string;
	venue: "home" | "away";
	state: MatchState;
	isCompleted: boolean;
	onPostponeClick: () => void;
}

export function MatchHeaderCard({
	opponent,
	date,
	venue,
	state,
	isCompleted,
	onPostponeClick,
}: MatchHeaderCardProps) {
	return (
		<div className="rounded-xl bg-white p-6 shadow">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-blue-900">
						vs {opponent}
					</h1>

					<p className="text-gray-600">
						{formatDisplayDateTime(date)} · {venue}
					</p>

					<div className="mt-2 flex flex-wrap items-center gap-2">
						<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
							{state}
						</span>

						<span
							className={`rounded-full px-3 py-1 text-xs font-semibold ${
								venue === "home"
									? "bg-blue-100 text-blue-800"
									: "bg-yellow-100 text-yellow-800"
							}`}
						>
							{venue === "home" ? "Home" : "Away"}
						</span>

						{isCompleted && (
							<span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
								Completed
							</span>
						)}
					</div>
				</div>

				{!isCompleted && (
					<button
						type="button"
						onClick={onPostponeClick}
						className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
					>
						Postpone
					</button>
				)}
			</div>
		</div>
	);
}