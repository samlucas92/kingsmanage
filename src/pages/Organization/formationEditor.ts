export function getFormationPosition(
	clientX: number,
	clientY: number,
	rect: Pick<DOMRect, "left" | "top" | "width" | "height">
) {
	return {
		x: clamp(((clientX - rect.left) / rect.width) * 100, 5, 95),
		y: clamp(((clientY - rect.top) / rect.height) * 100, 5, 95),
	};
}

export function clamp(value: number, minimum: number, maximum: number) {
	return Math.min(maximum, Math.max(minimum, Math.round(value * 10) / 10));
}
