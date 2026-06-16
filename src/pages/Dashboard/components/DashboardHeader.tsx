import type { UserRole } from "../../../types/auth";
import type { DashboardTabDefinition } from "../dashboardConfig";

export default function DashboardHeader({
	activeTabDefinition,
	currentRole,
	isLoading,
	loadErrors,
}: {
	activeTabDefinition?: DashboardTabDefinition;
	currentRole: UserRole;
	isLoading: boolean;
	loadErrors: string[];
}) {
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
						{currentRole === "Player" ? "Player landing point" : "Management landing point"}
					</p>

					<h1 className="mt-2 text-3xl font-bold text-slate-900">
						{activeTabDefinition?.label ?? "Dashboard"}
					</h1>

					<p className="mt-2 max-w-3xl text-sm text-slate-600">
						{activeTabDefinition?.description}
					</p>

					<div className="mt-4 flex flex-wrap gap-2">
						<span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
							{currentRole}
						</span>

						{isLoading && (
							<span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
								Loading dashboard data...
							</span>
						)}

						{loadErrors.length > 0 && (
							<span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
								Some dashboard data failed to load.
							</span>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
