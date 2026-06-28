import { useRealtimeStore } from "../../stores/realtime";

export default function RealtimeStatus() {
	const status = useRealtimeStore((state) => state.status);

	if (status === "disconnected") {
		return null;
	}

	const isLive = status === "connected";
	const label = isLive
		? "Live updates connected"
		: status === "unavailable"
			? "Live updates unavailable; using background refresh"
			: "Reconnecting live updates";

	return (
		<span
			className={`hidden h-2.5 w-2.5 rounded-full sm:block ${
				isLive ? "bg-emerald-500" : "animate-pulse bg-amber-500"
			}`}
			title={label}
			aria-label={label}
			role="status"
		/>
	);
}
