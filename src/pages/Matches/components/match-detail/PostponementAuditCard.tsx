import PanelCard from "../../../../components/compositions/PanelCard";
import StatusBadge from "../../../../components/compositions/StatusBadge";
import { formatDisplayDateTime } from "../../../../utils/date";

type PostponementRecord = {
	id?: string;
	fromDate?: string;
	originalDate?: string;
	previousDate?: string;
	oldDate?: string;
	toDate?: string;
	newDate?: string;
	rescheduledDate?: string;
	postponedAt?: string;
	createdAt?: string;
	date?: string;
	reason?: string;
};

interface PostponementAuditCardProps {
	postponements?: PostponementRecord[];
}

export function PostponementAuditCard({
	postponements = [],
}: PostponementAuditCardProps) {
	const sortedPostponements = [...postponements].sort(
		(firstPostponement, secondPostponement) =>
			getRecordTimestamp(secondPostponement) -
			getRecordTimestamp(firstPostponement)
	);

	return (
		<PanelCard
			title="Postponement History"
			description="Tracks when this fixture has been postponed or rearranged."
			action={
				<StatusBadge
					label={`${postponements.length} ${
						postponements.length === 1 ? "change" : "changes"
					}`}
					tone={postponements.length > 0 ? "warning" : "neutral"}
				/>
			}
		>
			{sortedPostponements.length === 0 ? (
				<div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
					No postponements recorded for this match.
				</div>
			) : (
				<div className="space-y-3">
					{sortedPostponements.map((postponement, index) => {
						const originalDate = getOriginalDate(postponement);
						const newDate = getNewDate(postponement);
						const recordedAt = getRecordedDate(postponement);

						return (
							<div
								key={postponement.id ?? `${originalDate}-${newDate}-${index}`}
								className="rounded-xl border border-amber-200 bg-amber-50 p-4"
							>
								<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
									<div className="min-w-0">
										<p className="text-sm font-bold text-amber-950">
											Postponement #{sortedPostponements.length - index}
										</p>

										{recordedAt && (
											<p className="mt-1 text-xs text-amber-800">
												Recorded {formatSafeDate(recordedAt)}
											</p>
										)}
									</div>

									<StatusBadge label="Postponed" tone="warning" />
								</div>

								<div className="mt-4 grid gap-3 sm:grid-cols-2">
									<DateChangeBlock
										label="Original date"
										value={originalDate}
										emptyLabel="No original date recorded"
									/>

									<DateChangeBlock
										label="New date"
										value={newDate}
										emptyLabel="No new date recorded"
									/>
								</div>

								{postponement.reason && (
									<div className="mt-3 rounded-lg bg-white/80 p-3">
										<p className="text-xs font-bold uppercase tracking-wide text-amber-800">
											Reason
										</p>

										<p className="mt-1 text-sm text-amber-950">
											{postponement.reason}
										</p>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</PanelCard>
	);
}

function DateChangeBlock({
	label,
	value,
	emptyLabel,
}: {
	label: string;
	value?: string;
	emptyLabel: string;
}) {
	return (
		<div className="rounded-lg bg-white/80 p-3">
			<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
				{label}
			</p>

			<p className="mt-1 text-sm font-semibold text-slate-900">
				{value ? formatSafeDate(value) : emptyLabel}
			</p>
		</div>
	);
}

function getOriginalDate(postponement: PostponementRecord) {
	return (
		postponement.fromDate ??
		postponement.originalDate ??
		postponement.previousDate ??
		postponement.oldDate
	);
}

function getNewDate(postponement: PostponementRecord) {
	return (
		postponement.toDate ??
		postponement.newDate ??
		postponement.rescheduledDate
	);
}

function getRecordedDate(postponement: PostponementRecord) {
	return postponement.postponedAt ?? postponement.createdAt ?? postponement.date;
}

function getRecordTimestamp(postponement: PostponementRecord) {
	const recordedDate = getRecordedDate(postponement);

	if (!recordedDate) {
		return 0;
	}

	const timestamp = new Date(recordedDate).getTime();

	return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatSafeDate(value: string) {
	const timestamp = new Date(value).getTime();

	if (!Number.isFinite(timestamp)) {
		return value;
	}

	return formatDisplayDateTime(value);
}