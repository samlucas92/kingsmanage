import {
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	Tooltip,
	type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type ReportBarSeries = {
	label: string;
	colour: string;
	values: number[];
};

type ReportBarChartProps = {
	labels: string[];
	series: ReportBarSeries[];
	maxValue?: number;
	tickPrecision?: number;
	ariaLabel: string;
};

export default function ReportBarChart({
	labels,
	series,
	maxValue,
	tickPrecision = 0,
	ariaLabel,
}: ReportBarChartProps) {
	const chartMax = Math.max(maxValue ?? 0, ...series.flatMap((item) => item.values), 1);
	const data = {
		labels,
		datasets: series.map((item) => ({
			label: item.label,
			data: item.values,
			backgroundColor: item.colour,
			borderColor: item.colour,
			borderRadius: 7,
			borderSkipped: false,
			maxBarThickness: 32,
		})),
	};
	const options: ChartOptions<"bar"> = {
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
				suggestedMax: chartMax,
				grid: { color: "#f1f5f9" },
				ticks: {
					color: "#64748b",
					precision: tickPrecision,
					font: { size: 11, weight: 700 },
				},
			},
		},
		plugins: {
			legend: {
				position: "top",
				labels: {
					boxHeight: 8,
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
		<div className="h-64" role="img" aria-label={ariaLabel}>
			<Bar data={data} options={options} />
		</div>
	);
}
