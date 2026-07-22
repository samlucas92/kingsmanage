import { useEffect, useState } from "react";

import BrandMark from "../layout/BrandMark";

const DEFAULT_COLD_START_SPLASH_MS = 45_000;
const MAX_DISPLAYED_PROGRESS = 96;

type ColdStartSplashProps = {
	title?: string;
	message?: string;
};

export default function ColdStartSplash({
	title = "Starting your club workspace",
	message = "Render can take a little moment to wake after inactivity. Yepset is getting everything ready.",
}: ColdStartSplashProps) {
	const progress = useColdStartProgress();
	const secondsRemaining = Math.max(
		0,
		Math.ceil((getColdStartSplashDurationMs() * (MAX_DISPLAYED_PROGRESS - progress)) / MAX_DISPLAYED_PROGRESS / 1000),
	);

	return (
		<div className="grid min-h-screen place-items-center bg-yepset-950 px-5 py-10 text-white">
			<div className="absolute inset-0 overflow-hidden" aria-hidden="true">
				<div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-yepset-400/20 blur-3xl sm:h-96 sm:w-96" />
				<div className="absolute -bottom-28 left-8 h-64 w-64 rounded-full bg-kick-400/15 blur-3xl sm:h-80 sm:w-80" />
				<div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
			</div>

			<section className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[.07] p-6 shadow-2xl shadow-black/25 backdrop-blur sm:p-8">
				<div className="flex justify-center">
					<BrandMark inverse />
				</div>

				<div className="mt-10 text-center">
					<p className="text-xs font-black uppercase tracking-[.24em] text-kick-300">Club together</p>
					<h1 className="mt-3 text-3xl font-black leading-tight tracking-[-.045em] sm:text-4xl">
						{title}
					</h1>
					<p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-yepset-100">
						{message}
					</p>
				</div>

				<div className="mt-8">
					<div className="flex items-center justify-between text-xs font-bold text-yepset-100">
						<span>Waking Yepset</span>
						<span>{progress}%</span>
					</div>
					<div
						className="mt-3 h-3 overflow-hidden rounded-full bg-white/12"
						role="progressbar"
						aria-label="Yepset startup progress"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={progress}
					>
						<div
							className="h-full rounded-full bg-gradient-to-r from-kick-400 via-yepset-300 to-yepset-500 shadow-[0_0_24px_rgba(190,242,100,.35)] transition-[width] duration-500 ease-out"
							style={{ width: `${progress}%` }}
						/>
					</div>
					<p className="mt-3 text-center text-xs leading-5 text-yepset-200">
						Usually ready in under a minute{secondsRemaining > 0 ? ` — about ${secondsRemaining}s left if this is a cold start.` : "."}
					</p>
				</div>
			</section>
		</div>
	);
}

function useColdStartProgress() {
	const durationMs = getColdStartSplashDurationMs();
	const [progress, setProgress] = useState(1);

	useEffect(() => {
		const startedAt = window.performance.now();

		const updateProgress = () => {
			const elapsedMs = window.performance.now() - startedAt;
			const nextProgress = Math.min(
				MAX_DISPLAYED_PROGRESS,
				Math.max(1, Math.round((elapsedMs / durationMs) * MAX_DISPLAYED_PROGRESS)),
			);
			setProgress(nextProgress);
		};

		updateProgress();
		const intervalId = window.setInterval(updateProgress, 250);
		return () => window.clearInterval(intervalId);
	}, [durationMs]);

	return progress;
}

function getColdStartSplashDurationMs() {
	const configuredMs = Number(import.meta.env.VITE_COLD_START_SPLASH_MS);

	if (Number.isFinite(configuredMs) && configuredMs >= 5_000) {
		return configuredMs;
	}

	return DEFAULT_COLD_START_SPLASH_MS;
}
