import { useCallback, useEffect, useRef, useState } from "react";

import { formsApi } from "../../../services/formsApi";

export const formAnalyticsInactivityMs = 60_000;
const durationPersistIntervalMs = 30_000;
const timerResolutionMs = 5_000;

type UseFormAnalyticsOptions = {
	formId?: string;
	goCode?: string;
	enabled: boolean;
};

export function useFormAnalytics({ formId, goCode, enabled }: UseFormAnalyticsOptions) {
	const [sessionId] = useState(() => crypto.randomUUID());
	const interactionTrackedRef = useRef(false);
	const fieldsTrackedRef = useRef(new Set<string>());
	const engagedDurationRef = useRef(0);
	const lastPersistedDurationRef = useRef(0);
	const lastTickRef = useRef(0);
	const lastActivityRef = useRef(0);

	const send = useCallback((
		eventName: "view" | "interaction" | "field-interaction" | "validation-error" | "duration",
		body: { fieldId?: string; engagedDurationMs?: number; errorType?: string } = {},
		keepalive = false
	) => {
		if (!enabled || !formId) return;
		void formsApi.trackAnalytics(formId, goCode, eventName, {
			sessionId,
			...body,
		}, keepalive).catch(() => undefined);
	}, [enabled, formId, goCode, sessionId]);

	const persistDuration = useCallback((keepalive = false) => {
		const duration = Math.round(engagedDurationRef.current);
		if (duration <= lastPersistedDurationRef.current) return;
		lastPersistedDurationRef.current = duration;
		send("duration", { engagedDurationMs: duration }, keepalive);
	}, [send]);

	useEffect(() => {
		if (!enabled || !formId) return;
		send("view");
	}, [enabled, formId, send]);

	useEffect(() => {
		if (!enabled || !formId) return;
		lastTickRef.current = Date.now();
		const markActivity = () => { lastActivityRef.current = Date.now(); };
		const tick = () => {
			const now = Date.now();
			engagedDurationRef.current += calculateEngagedDelta({
				now,
				lastTick: lastTickRef.current,
				lastActivity: lastActivityRef.current,
				isVisible: document.visibilityState === "visible",
				isFocused: document.hasFocus(),
			});
			lastTickRef.current = now;
		};
		const persist = () => { tick(); persistDuration(true); };
		const timer = window.setInterval(tick, timerResolutionMs);
		const persistenceTimer = window.setInterval(() => persistDuration(), durationPersistIntervalMs);
		for (const eventName of ["pointerdown", "keydown", "touchstart"] as const) {
			window.addEventListener(eventName, markActivity, { passive: true });
		}
		window.addEventListener("pagehide", persist);
		document.addEventListener("visibilitychange", persist);
		return () => {
			window.clearInterval(timer);
			window.clearInterval(persistenceTimer);
			for (const eventName of ["pointerdown", "keydown", "touchstart"] as const) {
				window.removeEventListener(eventName, markActivity);
			}
			window.removeEventListener("pagehide", persist);
			document.removeEventListener("visibilitychange", persist);
			persist();
		};
	}, [enabled, formId, persistDuration]);

	const trackInteraction = useCallback((fieldId?: string) => {
		lastActivityRef.current = Date.now();
		if (fieldId && !fieldsTrackedRef.current.has(fieldId)) {
			fieldsTrackedRef.current.add(fieldId);
			interactionTrackedRef.current = true;
			send("field-interaction", { fieldId });
		} else if (!interactionTrackedRef.current) {
			interactionTrackedRef.current = true;
			send("interaction");
		}
	}, [send]);

	const trackValidationError = useCallback((fieldId?: string, errorType = "validation") => {
		send("validation-error", { fieldId, errorType });
	}, [send]);

	return {
		sessionId,
		trackInteraction,
		trackValidationError,
		persistDuration,
	};
}

export function calculateEngagedDelta({
	now,
	lastTick,
	lastActivity,
	isVisible,
	isFocused,
}: {
	now: number;
	lastTick: number;
	lastActivity: number;
	isVisible: boolean;
	isFocused: boolean;
}) {
	if (!isVisible || !isFocused) return 0;
	const activeUntil = Math.min(now, lastActivity + formAnalyticsInactivityMs);
	return Math.max(0, activeUntil - lastTick);
}
