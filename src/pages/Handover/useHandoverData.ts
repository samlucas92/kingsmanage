import { useCallback, useEffect, useState } from "react";
import { handoverApi } from "../../services/handoverApi";
import type { HandoverVaultSnapshot } from "../../types/handover";

export function useHandoverData() {
	const [data, setData] = useState<HandoverVaultSnapshot | null>(null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const reload = useCallback(async () => {
		setLoading(true);
		try {
			setData(await handoverApi.getSnapshot());
			setError("");
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : "Failed to load Handover Vault.");
		} finally {
			setLoading(false);
		}
	}, []);
	useEffect(() => {
		let active = true;
		void handoverApi.getSnapshot()
			.then((snapshot) => {
				if (active) setData(snapshot);
			})
			.catch((loadError) => {
				if (active) setError(loadError instanceof Error ? loadError.message : "Failed to load Handover Vault.");
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => { active = false; };
	}, []);
	return { data, error, loading, reload, setError };
}
