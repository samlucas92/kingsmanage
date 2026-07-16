import {
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Tooltip,
	type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);

type ReportLineSeries = {
	label: string;
	colour: string;
	values: number[];
};

type ReportLineChartProps = {
	labels: string[];
	series: ReportLineSeries[];
	ariaLabel: string;
};

export default function ReportLineChart({
	labels,
	series,
	ariaLabel,
}: ReportLineChartProps) {
	const data = {
		labels,
		datasets: series.map((item) => ({
			label: item.label,
			data: item.values,
			borderColor: item.colour,
			backgroundColor: item.colour,
			borderWidth: 3,
			pointRadius: 4,
			pointHoverRadius: 6,
			tension: 0.35,
		})),
	};
	const options: ChartOptions<"line"> = {
		responsive: true,
		maintainAspectRatio: false,
		animation: false,
		scales: {
			x: {
				grid: { display: false },
				ticks: {
					color: "#64748b",
					font: { size: 11, weight: 700 },
				},
			},
			y: {
				beginAtZero: true,
				grid: { color: "#f1f5f9" },
				ticks: {
					color: "#64748b",
					precision: 0,
					font: { size: 11, weight: 700 },
				},
			},
		},
		plugins: {
			legend: {
				position: "top",
				labels: {
					boxHeight: 8,
					boxWidth: 18,
					color: "#475569",
					font: { size: 11, weight: 700 },
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
		<div className="h-72" role="img" aria-label={ariaLabel}>
			<Line data={data} options={options} />
		</div>
	);
}
