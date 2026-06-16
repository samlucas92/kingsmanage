export function formatDateForInput(date: string) {
	const parsedDate = new Date(date);

	if (Number.isNaN(parsedDate.getTime())) {
		return "";
	}

	const year = parsedDate.getFullYear();
	const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
	const day = String(parsedDate.getDate()).padStart(2, "0");
	const hours = String(parsedDate.getHours()).padStart(2, "0");
	const minutes = String(parsedDate.getMinutes()).padStart(2, "0");

	return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatDisplayDate(date: string) {
	const parsedDate = new Date(date);

	if (Number.isNaN(parsedDate.getTime())) {
		return "Invalid date";
	}

	return parsedDate.toLocaleDateString();
}

export function formatDisplayTime(date: string) {
	const parsedDate = new Date(date);

	if (Number.isNaN(parsedDate.getTime())) {
		return "";
	}

	return parsedDate.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatDisplayDateTime(date: string) {
	const parsedDate = new Date(date);

	if (Number.isNaN(parsedDate.getTime())) {
		return "Invalid date";
	}

	return parsedDate.toLocaleString();
}
export function startOfToday() {
	const date = new Date();
	date.setHours(0, 0, 0, 0);
	return date;
}
