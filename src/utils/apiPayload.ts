export function omitBlankId<T extends { id?: string }>(value: T) {
	if (value.id?.trim()) return value;

	const payload: Partial<T> = { ...value };
	delete payload.id;
	return payload;
}
