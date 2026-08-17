export function formatDate(value: string | null | undefined) {
	return value ? new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "No date";
}
