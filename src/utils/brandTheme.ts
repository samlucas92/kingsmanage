const hexColorPattern = /^#[0-9a-f]{6}$/i;

const themedProperties = [
	"--color-yepset-50",
	"--color-yepset-100",
	"--color-yepset-200",
	"--color-yepset-300",
	"--color-yepset-400",
	"--color-yepset-500",
	"--color-yepset-600",
	"--color-yepset-700",
	"--color-yepset-800",
	"--color-yepset-900",
	"--color-yepset-950",
	"--color-kick-300",
	"--color-kick-400",
	"--color-kick-500",
	"--color-canvas",
] as const;

export function createBrandTheme(primaryColor: string, secondaryColor: string) {
	const primary = normaliseHexColor(primaryColor, "#0f766e");
	const secondary = normaliseHexColor(secondaryColor, "#d9f99d");

	return {
		"--color-yepset-50": mixHex(primary, "#ffffff", 0.08),
		"--color-yepset-100": mixHex(primary, "#ffffff", 0.16),
		"--color-yepset-200": mixHex(primary, "#ffffff", 0.3),
		"--color-yepset-300": mixHex(primary, "#ffffff", 0.48),
		"--color-yepset-400": mixHex(primary, "#ffffff", 0.72),
		"--color-yepset-500": primary,
		"--color-yepset-600": mixHex(primary, "#000000", 0.84),
		"--color-yepset-700": mixHex(primary, "#000000", 0.68),
		"--color-yepset-800": mixHex(primary, "#000000", 0.54),
		"--color-yepset-900": mixHex(primary, "#000000", 0.4),
		"--color-yepset-950": mixHex(primary, "#000000", 0.25),
		"--color-kick-300": mixHex(secondary, "#ffffff", 0.84),
		"--color-kick-400": secondary,
		"--color-kick-500": mixHex(secondary, "#000000", 0.84),
		"--color-canvas": mixHex(primary, "#ffffff", 0.04),
	} satisfies Record<(typeof themedProperties)[number], string>;
}

export function applyBrandTheme(
	target: Pick<CSSStyleDeclaration, "setProperty" | "removeProperty">,
	colors?: { primaryColor: string; secondaryColor: string }
) {
	if (!colors) {
		for (const property of themedProperties) target.removeProperty(property);
		return;
	}

	for (const [property, value] of Object.entries(createBrandTheme(
		colors.primaryColor,
		colors.secondaryColor
	))) {
		target.setProperty(property, value);
	}
}

function normaliseHexColor(value: string, fallback: string) {
	return hexColorPattern.test(value) ? value.toLowerCase() : fallback;
}

function mixHex(foreground: string, background: string, foregroundWeight: number) {
	const foregroundRgb = parseHex(foreground);
	const backgroundRgb = parseHex(background);
	const mix = (channel: keyof typeof foregroundRgb) => Math.round(
		foregroundRgb[channel] * foregroundWeight +
		backgroundRgb[channel] * (1 - foregroundWeight)
	);

	return `#${toHex(mix("red"))}${toHex(mix("green"))}${toHex(mix("blue"))}`;
}

function parseHex(value: string) {
	return {
		red: Number.parseInt(value.slice(1, 3), 16),
		green: Number.parseInt(value.slice(3, 5), 16),
		blue: Number.parseInt(value.slice(5, 7), 16),
	};
}

function toHex(value: number) {
	return value.toString(16).padStart(2, "0");
}
