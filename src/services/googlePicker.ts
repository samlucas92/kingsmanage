import type { GooglePickerToken } from "../types/integrations";

type PickerData = {
	action?: string;
	docs?: Array<{ id?: string }>;
};

type Picker = { setVisible: (visible: boolean) => void };
type PickerBuilder = {
	addView: (viewId: string) => PickerBuilder;
	setAppId: (appId: string) => PickerBuilder;
	setDeveloperKey: (apiKey: string) => PickerBuilder;
	setOAuthToken: (accessToken: string) => PickerBuilder;
	setCallback: (callback: (data: PickerData) => void) => PickerBuilder;
	setTitle: (title: string) => PickerBuilder;
	build: () => Picker;
};

declare global {
	interface Window {
		gapi?: { load: (library: string, callback: () => void) => void };
		google?: {
			picker: {
				PickerBuilder: new () => PickerBuilder;
				ViewId: { SPREADSHEETS: string };
			};
		};
	}
}

let pickerLoadPromise: Promise<void> | null = null;

function loadPicker() {
	if (window.google?.picker) return Promise.resolve();
	if (pickerLoadPromise) return pickerLoadPromise;
	pickerLoadPromise = new Promise<void>((resolve, reject) => {
		const start = () => {
			if (!window.gapi) return reject(new Error("Google Picker could not be loaded."));
			window.gapi.load("picker", () => window.google?.picker ? resolve() : reject(new Error("Google Picker could not be initialized.")));
		};
		const existing = document.querySelector<HTMLScriptElement>('script[data-google-picker="true"]');
		if (existing) {
			existing.addEventListener("load", start, { once: true });
			existing.addEventListener("error", () => reject(new Error("Google Picker could not be loaded.")), { once: true });
			return;
		}
		const script = document.createElement("script");
		script.src = "https://apis.google.com/js/api.js";
		script.async = true;
		script.dataset.googlePicker = "true";
		script.addEventListener("load", start, { once: true });
		script.addEventListener("error", () => reject(new Error("Google Picker could not be loaded.")), { once: true });
		document.head.appendChild(script);
	});
	return pickerLoadPromise;
}

export async function chooseGoogleSpreadsheet(token: GooglePickerToken): Promise<string | null> {
	await loadPicker();
	const pickerApi = window.google?.picker;
	if (!pickerApi) throw new Error("Google Picker could not be initialized.");
	return new Promise((resolve) => {
		new pickerApi.PickerBuilder()
			.addView(pickerApi.ViewId.SPREADSHEETS)
			.setAppId(token.appId)
			.setDeveloperKey(token.apiKey)
			.setOAuthToken(token.accessToken)
			.setTitle("Choose the club stats spreadsheet")
			.setCallback((data) => {
				if (data.action === "picked") resolve(data.docs?.[0]?.id ?? null);
				if (data.action === "cancel") resolve(null);
			})
			.build()
			.setVisible(true);
	});
}
