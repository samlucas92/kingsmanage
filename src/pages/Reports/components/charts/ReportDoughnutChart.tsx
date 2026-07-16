import {
	ArcElement,
	Chart as ChartJS,
	Legend,
	Tooltip,
	type ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

type ReportDoughnutSegment = {
	label: string;
	value: number;
	colour: string;
};

type ReportDoughnutChartProps = {
	segments: ReportDoughnutSegment[];
	ariaLabel: string;
	centerLabel?: string;
	centerValue?: string | number;
};

export default function ReportDoughnutChart({
	segments,
	ariaLabel,
	centerLabel,
	centerValue,
}: ReportDoughnutChartProps) {
	const data = {
		labels: segments.map((segment) => segment.label),
		datasets: [
			{
				data: segments.map((segment) => segment.value),
				backgroundColor: segments.map((segment) => segment.colour),
				borderColor: "#ffffff",
				borderWidth: 4,
				hoverOffset: 6,
			},
		],
	};
	const options: ChartOptions<"doughnut"> = {
		responsive: true,
		maintainAspectRatio: false,
		animation: false,
		cutout: "68%",
		plugins: {
			legend: {
				position: "bottom",
				labels: {
					boxHeight: 10,
					boxWidth: 14,
					color: "#475569",
					font: { size: 11, weight: 700 },
					useBorderRadius: true,
					borderRadius: 4,
				},
			},
			tooltip: {
				backgroundColor: "#082a28",
				titleFont: { weight: 800 },
				bodyFont: { weight: 700 },
				padding: 10,
			},
		},
	};

	return (
		<div className="relative h-72" role="img" aria-label={ariaLabel}>
			<Doughnut data={data} options={options} />
			{centerValue !== undefined && (
				<div className="pointer-events-none absolute inset-x-0 top-[42%] -translate-y-1/2 text-center">
					<p className="text-2xl font-black tracking-[-.03em] text-slate-950">{centerValue}</p>
					{centerLabel && <p className="text-xs font-black uppercase tracking-wide text-slate-500">{centerLabel}</p>}
				</div>
			)}
		</div>
	);
}
