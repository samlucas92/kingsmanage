type ProfileSummaryProps = {
	compact?: boolean;
};

export default function ProfileSummary({ compact = false }: ProfileSummaryProps) {
	return (
		<div
			className={`flex items-center gap-3 ${
				compact ? "rounded-xl bg-blue-950/40 p-3" : ""
			}`}
		>
			<div
				className={`shrink-0 rounded-full bg-blue-900 ${
					compact ? "h-10 w-10 ring-2 ring-blue-700" : "h-8 w-8"
				}`}
			/>

			<div className="min-w-0">
				<p
					className={`truncate font-semibold ${
						compact ? "text-white" : "text-slate-700"
					}`}
				>
					Coach
				</p>

				{compact && (
					<p className="truncate text-xs text-blue-200">
						Kingsbridge Colts
					</p>
				)}
			</div>
		</div>
	);
}