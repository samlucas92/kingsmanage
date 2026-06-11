const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
	throw new Error("VITE_API_BASE_URL is not configured.");
}

type RequestOptions = {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		method: options.method ?? "GET",
		headers: {
			"Content-Type": "application/json",
		},
		body: options.body === undefined ? undefined : JSON.stringify(options.body),
	});

	if (!response.ok) {
		const errorMessage = await getErrorMessage(response);

		throw new Error(errorMessage);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}

async function getErrorMessage(response: Response) {
	const fallbackMessage = `Request failed with status ${response.status}`;

	try {
		const text = await response.text();

		return text || fallbackMessage;
	} catch {
		return fallbackMessage;
	}
}

export const apiClient = {
	get: <T>(path: string) => request<T>(path),

	post: <T>(path: string, body: unknown) =>
		request<T>(path, {
			method: "POST",
			body,
		}),

	put: <T>(path: string, body: unknown) =>
		request<T>(path, {
			method: "PUT",
			body,
		}),

	patch: <T>(path: string, body: unknown) =>
		request<T>(path, {
			method: "PATCH",
			body,
		}),

	delete: <T>(path: string) =>
		request<T>(path, {
			method: "DELETE",
		}),
};