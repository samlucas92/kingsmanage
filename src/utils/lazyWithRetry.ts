import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const CHUNK_RELOAD_KEY = "yepset.chunkReload";
const CHUNK_ERROR_PATTERNS = [
	"failed to fetch dynamically imported module",
	"error loading dynamically imported module",
	"importing a module script failed",
	"loading chunk",
	"chunkloaderror",
];

// React's lazy() definition uses `any` so this constraint must mirror it to preserve each component's props.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyComponent = ComponentType<any>;
type LazyModule<T extends LazyComponent> = { default: T };

export function lazyWithRetry<T extends LazyComponent>(
	load: () => Promise<LazyModule<T>>
): LazyExoticComponent<T> {
	return lazy(async () => {
		try {
			const loaded = await load();
			sessionStorage.removeItem(CHUNK_RELOAD_KEY);
			return loaded;
		} catch (error) {
			if (!isChunkLoadError(error)) throw error;

			await delay(1000);
			try {
				const loaded = await load();
				sessionStorage.removeItem(CHUNK_RELOAD_KEY);
				return loaded;
			} catch (retryError) {
				if (!isChunkLoadError(retryError)) throw retryError;
				const reloadMarker = `${window.location.pathname}${window.location.search}`;
				if (sessionStorage.getItem(CHUNK_RELOAD_KEY) !== reloadMarker) {
					sessionStorage.setItem(CHUNK_RELOAD_KEY, reloadMarker);
					await prepareForFreshReload();
					window.location.reload();
					return new Promise<LazyModule<T>>(() => undefined);
				}

				throw retryError;
			}
		}
	});
}

export function isChunkLoadError(error: unknown) {
	const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
	const normalized = message.toLowerCase();
	return CHUNK_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export async function prepareForFreshReload() {
	if ("caches" in window) {
		const cacheNames = await caches.keys();
		await Promise.all(
			cacheNames
				.filter((cacheName) => cacheName.startsWith("workbox-") || cacheName === "yepset-pages")
				.map((cacheName) => caches.delete(cacheName))
		);
	}

	if ("serviceWorker" in navigator) {
		const registrations = await navigator.serviceWorker.getRegistrations();
		await Promise.all(registrations.map((registration) => registration.update().catch(() => undefined)));
	}
}

function delay(milliseconds: number) {
	return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
