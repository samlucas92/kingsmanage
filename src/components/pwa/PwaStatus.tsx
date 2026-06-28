import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useAuthStore } from "../../stores/auth";
import BrandMark from "../layout/BrandMark";

type InstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const INSTALL_DISMISSED_KEY = "yepset.installPromptDismissed";

export default function PwaStatus() {
	const [isOnline, setIsOnline] = useState(() => navigator.onLine);
	const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
	const [isInstallHelpOpen, setIsInstallHelpOpen] = useState(false);
	const [isInstallDismissed, setIsInstallDismissed] = useState(
		() => localStorage.getItem(INSTALL_DISMISSED_KEY) === "true"
	);
	const currentUser = useAuthStore((state) => state.currentUser);
	const isStandalone = window.matchMedia("(display-mode: standalone)").matches
		|| ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
	const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegisteredSW(_serviceWorkerUrl, registration) {
			if (!registration) return;
			const updateTimer = window.setInterval(() => void registration.update(), 60 * 60 * 1000);
			return () => window.clearInterval(updateTimer);
		},
	});

	useEffect(() => {
		function updateOnlineStatus() {
			setIsOnline(navigator.onLine);
		}

		function captureInstallPrompt(event: Event) {
			event.preventDefault();
			setInstallPrompt(event as InstallPromptEvent);
		}

		window.addEventListener("online", updateOnlineStatus);
		window.addEventListener("offline", updateOnlineStatus);
		window.addEventListener("beforeinstallprompt", captureInstallPrompt);

		return () => {
			window.removeEventListener("online", updateOnlineStatus);
			window.removeEventListener("offline", updateOnlineStatus);
			window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
		};
	}, []);

	async function installApp() {
		if (!installPrompt) {
			setIsInstallHelpOpen(true);
			return;
		}

		await installPrompt.prompt();
		const choice = await installPrompt.userChoice;
		if (choice.outcome === "accepted") setInstallPrompt(null);
	}

	function dismissInstall() {
		localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
		setIsInstallDismissed(true);
		setIsInstallHelpOpen(false);
	}

	const canOfferInstall = !isStandalone && !isInstallDismissed && (Boolean(installPrompt) || isIos);

	if (!isOnline) {
		if (!currentUser) {
			return (
				<div className="fixed inset-0 z-[80] grid place-items-center bg-canvas p-5">
					<div className="surface-card w-full max-w-md p-6 text-center sm:p-8">
						<div className="flex justify-center"><BrandMark /></div>
						<div className="mx-auto mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-2xl font-black text-amber-800">!</div>
						<h1 className="mt-5 text-2xl font-black tracking-[-.03em] text-slate-950">You’re offline</h1>
						<p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
							Reconnect to sign in and load your club data. Yepset will try again when your connection returns.
						</p>
						<button type="button" className="btn-primary mt-6 w-full" onClick={() => window.location.reload()}>
							Try again
						</button>
					</div>
				</div>
			);
		}

		return (
			<StatusCard tone="offline" title="You’re offline" message="Yepset will reconnect automatically. Live club data may be unavailable." />
		);
	}

	if (needRefresh) {
		return (
			<StatusCard
				tone="update"
				title="A new Yepset version is ready"
				message="Refresh now to use the latest features."
				primaryLabel="Update"
				onPrimary={() => void updateServiceWorker(true)}
				onClose={() => setNeedRefresh(false)}
			/>
		);
	}

	if (offlineReady) {
		return (
			<StatusCard
				tone="ready"
				title="Yepset is ready"
				message="The app shell is available when your connection drops."
				onClose={() => setOfflineReady(false)}
			/>
		);
	}

	if (canOfferInstall) {
		return (
			<>
				<StatusCard
					tone="install"
					title="Install Yepset"
					message="Open your club faster from your home screen."
					primaryLabel="Install"
					onPrimary={() => void installApp()}
					onClose={dismissInstall}
				/>
				{isInstallHelpOpen && (
					<div className="fixed inset-0 z-[70] grid place-items-center bg-yepset-950/55 p-4 backdrop-blur-sm">
						<div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
							<p className="text-xs font-black uppercase tracking-[.14em] text-yepset-600">Install on iPhone or iPad</p>
							<h2 className="mt-2 text-xl font-black text-slate-950">Add Yepset to your Home Screen</h2>
							<ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
								<li><strong className="text-slate-900">1.</strong> Tap Safari’s Share button.</li>
								<li><strong className="text-slate-900">2.</strong> Choose “Add to Home Screen”.</li>
								<li><strong className="text-slate-900">3.</strong> Tap “Add”.</li>
							</ol>
							<div className="mt-5 flex justify-end gap-2">
								<button type="button" className="btn-secondary" onClick={dismissInstall}>Not now</button>
								<button type="button" className="btn-primary" onClick={() => setIsInstallHelpOpen(false)}>Got it</button>
							</div>
						</div>
					</div>
				)}
			</>
		);
	}

	return null;
}

function StatusCard({
	tone,
	title,
	message,
	primaryLabel,
	onPrimary,
	onClose,
}: {
	tone: "offline" | "update" | "ready" | "install";
	title: string;
	message: string;
	primaryLabel?: string;
	onPrimary?: () => void;
	onClose?: () => void;
}) {
	return (
		<div className="fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-[60] mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-white/20 bg-yepset-950 p-3 text-white shadow-[0_20px_60px_rgba(8,42,40,.28)] sm:p-4">
			<span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone === "offline" ? "bg-amber-300 text-amber-950" : "bg-kick-400 text-yepset-950"}`}>
				{tone === "offline" ? "!" : "Y"}
			</span>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-black">{title}</p>
				<p className="mt-0.5 text-xs leading-5 text-yepset-100">{message}</p>
			</div>
			{primaryLabel && onPrimary && (
				<button type="button" onClick={onPrimary} className="min-h-10 rounded-xl bg-kick-400 px-3 text-xs font-black text-yepset-950 hover:bg-kick-300">
					{primaryLabel}
				</button>
			)}
			{onClose && (
				<button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white/65 hover:bg-white/10 hover:text-white" aria-label="Dismiss">
					×
				</button>
			)}
		</div>
	);
}
