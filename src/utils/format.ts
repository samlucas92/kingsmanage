const DEFAULT_LOCALE = "en-GB";

export function formatCurrency(value: number) {
	return new Intl.NumberFormat(DEFAULT_LOCALE, {
		style: "currency",
		currency: "GBP",
	}).format(value);
}

export function formatNumber(value: number) {
	return new Intl.NumberFormat(DEFAULT_LOCALE).format(value);
}

export function formatPercentage(value: number) {
	return `${Math.round(value)}%`;
}

export function formatDateTime(value: string | number | Date) {
	return new Date(value).toLocaleString(DEFAULT_LOCALE);
}

export function formatDate(value: string | number | Date) {
	return new Date(value).toLocaleDateString(DEFAULT_LOCALE);
}