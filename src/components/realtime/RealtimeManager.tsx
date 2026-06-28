import { useEffect } from "react";

import { useAuthStore } from "../../stores/auth";
import { useRealtimeStore } from "../../stores/realtime";

export default function RealtimeManager() {
	const token = useAuthStore((state) => state.token);
	const start = useRealtimeStore((state) => state.start);
	const stop = useRealtimeStore((state) => state.stop);

	useEffect(() => {
		if (token) {
			void start();
		} else {
			void stop();
		}
	}, [start, stop, token]);

	return null;
}
