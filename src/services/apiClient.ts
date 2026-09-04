const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
	throw new Error("VITE_API_BASE_URL is not configured.");
}

const AUTH_TOKEN_STORAGE_KEY = "kingsmanage.authToken";

export function getRealtimeHubUrl() {
	const apiRoot = API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");
	return `${apiRoot}/hubs/club`;
}

type RequestOptions = {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: unknown;
	rawBody?: BodyInit;
	contentType?: string;
	authenticated?: boolean;
	keepalive?: boolean;
};

export function getStoredAuthToken() {
	return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredAuthToken(token: string) {
	localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearStoredAuthToken() {
	localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const headers: Record<string, string> = {
		"Content-Type": options.contentType ?? "application/json",
	};

	const token = getStoredAuthToken();

	if (token && options.authenticated !== false) {
		headers.Authorization = `Bearer ${token}`;
	}

	const response = await fetch(`${API_BASE_URL}${path}`, {
		method: options.method ?? "GET",
		headers,
		body: options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
		keepalive: options.keepalive,
	});

	if (response.status === 401) {
		window.dispatchEvent(new CustomEvent("kingsmanage:unauthorised"));
	}

	if (!response.ok) {
		const errorMessage = await getErrorMessage(response);
		throw new Error(errorMessage);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}

async function requestBlob(path: string): Promise<Blob> {
	const headers: Record<string, string> = {};
	const token = getStoredAuthToken();
	if (token) headers.Authorization = `Bearer ${token}`;

	const response = await fetch(`${API_BASE_URL}${path}`, { headers });
	if (response.status === 401) {
		window.dispatchEvent(new CustomEvent("kingsmanage:unauthorised"));
	}
	if (!response.ok) {
		throw new Error(await getErrorMessage(response));
	}
	return response.blob();
}

async function getErrorMessage(response: Response) {
	const fallbackMessage = `Request failed with status ${response.status}`;

	try {
		const text = await response.text();

		if (!text) {
			return fallbackMessage;
		}

		try {
			const parsed = JSON.parse(text) as { message?: string; detail?: string; title?: string; errors?: Record<string, string[]> };

			if (parsed.message) {
				return parsed.message;
			}

			if (parsed.detail) {
				return parsed.detail;
			}

			if (parsed.title) {
				return parsed.title;
			}

			if (parsed.errors) {
				const firstError = Object.values(parsed.errors).flat()[0];

				if (firstError) {
					return firstError;
				}
			}
		} catch {
			return text;
		}

		return text;
	} catch {
		return fallbackMessage;
	}
}

export const apiClient = {
	get: <T>(path: string, options?: RequestOptions) => request<T>(path, options),
	getBlob: (path: string) => requestBlob(path),
	post: <T>(path: string, body: unknown, options?: RequestOptions) => request<T>(path, {
		...options,
		method: "POST",
		body,
	}),
	postKeepalive: <T>(path: string, body: unknown, options?: RequestOptions) => request<T>(path, {
		...options,
		method: "POST",
		body,
		keepalive: true,
	}),
	put: <T>(path: string, body: unknown) => request<T>(path, {
		method: "PUT",
		body,
	}),
	putRaw: <T>(path: string, body: BodyInit, contentType: string) => request<T>(path, {
		method: "PUT",
		rawBody: body,
		contentType,
	}),
	patch: <T>(path: string, body: unknown) => request<T>(path, {
		method: "PATCH",
		body,
	}),
	delete: <T>(path: string) => request<T>(path, {
		method: "DELETE",
	}),
};
