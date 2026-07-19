type RadarChartMetric = {
	key: string;
	label: string;
	value: number;
};

export default function RadarChart({
	metrics,
	max = 5,
	size = 280,
}: {
	metrics: RadarChartMetric[];
	max?: number;
	size?: number;
}) {
	const centre = size / 2;
	const radius = size * 0.36;
	const values = metrics.length > 2 ? metrics : [];
	const rings = [1, 2, 3, 4, 5];
	const points = values.map((metric, index) =>
		getPoint(index, values.length, centre, radius * (metric.value / max))
	);
	const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");

	if (values.length === 0) {
		return (
			<div className="grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
				No radar data yet.
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
			<svg
				viewBox={`0 0 ${size} ${size}`}
				role="img"
				aria-label="Training development radar chart"
				className="mx-auto h-auto w-full max-w-[320px]"
			>
				{rings.map((ring) => {
					const ringPoints = values
						.map((_, index) => getPoint(index, values.length, centre, radius * (ring / max)))
						.map((point) => `${point.x},${point.y}`)
						.join(" ");

					return (
						<polygon
							key={ring}
							points={ringPoints}
							fill="none"
							stroke="#e2e8f0"
							strokeWidth="1"
						/>
					);
				})}

				{values.map((metric, index) => {
					const outer = getPoint(index, values.length, centre, radius);
					const label = getPoint(index, values.length, centre, radius + 28);

					return (
						<g key={metric.key}>
							<line x1={centre} y1={centre} x2={outer.x} y2={outer.y} stroke="#e2e8f0" strokeWidth="1" />
							<text
								x={label.x}
								y={label.y}
								textAnchor="middle"
								dominantBaseline="middle"
								className="fill-slate-600 text-[10px] font-bold"
							>
								{metric.label.length > 13 ? `${metric.label.slice(0, 11)}…` : metric.label}
							</text>
						</g>
					);
				})}

				<polygon
					points={polygon}
					fill="rgba(20,119,100,.24)"
					stroke="#147764"
					strokeWidth="3"
				/>

				{points.map((point, index) => (
					<circle
						key={values[index].key}
						cx={point.x}
						cy={point.y}
						r="4"
						fill="#147764"
						stroke="white"
						strokeWidth="2"
					/>
				))}
			</svg>
		</div>
	);
}

function getPoint(index: number, total: number, centre: number, radius: number) {
	const angle = (Math.PI * 2 * index) / total - Math.PI / 2;

	return {
		x: centre + Math.cos(angle) * radius,
		y: centre + Math.sin(angle) * radius,
	};
}
