import type { PostponementAudit } from "../../../../stores/match";
import { formatDisplayDateTime } from "../../../../utils/date";

interface PostponementAuditCardProps {
	postponements: PostponementAudit[];
}

export function PostponementAuditCard({
	postponements,
}: PostponementAuditCardProps) {
	return (
		<section className="rounded-xl bg-white p-6 shadow">
			<h2 className="text-lg font-bold text-blue-900">
				Postponement Audit
			</h2>

			{postponements.length === 0 ? (
				<p className="mt-2 text-sm text-gray-500">
					No postponements recorded.
				</p>
			) : (
				<div className="mt-4 space-y-3">
					{postponements.map((audit) => (
						<div key={audit.id} className="rounded-lg bg-gray-50 p-3 text-sm">
							<p>
								{formatDisplayDateTime(audit.oldDate)} →{" "}
								{formatDisplayDateTime(audit.newDate)}
							</p>

							{audit.reason && (
								<p className="mt-1 text-gray-600">{audit.reason}</p>
							)}
						</div>
					))}
				</div>
			)}
		</section>
	);
}