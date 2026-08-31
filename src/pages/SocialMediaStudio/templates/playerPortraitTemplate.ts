import { loadTemplateImage } from "../socialGraphicCanvas";
import playerTemplateWithCircle from "../../../assets/social-media/backgrounds/kingsplayertemplate.png";
import playerTemplateWithoutCircle from "../../../assets/social-media/backgrounds/kingsplayertemplatewithoutcircle.png";
import type {
	SocialGraphicTemplate,
	SocialGraphicTemplateRenderContext,
} from "../types";
import {
	drawFittedText,
	drawImageContain,
	EDITORIAL_GOLD,
	EDITORIAL_WHITE,
	getTextField,
} from "./editorialCanvas";
import {
	parseEditableTemplateLayout,
	serializeEditableTemplateLayout,
	withElementTransform,
	withElementTransformAsync,
} from "./editableTemplateLayout";
import type { EditableTemplateLayout } from "./editableTemplateLayout";

export type PlayerPortraitElementId =
	| "background"
	| "player-image"
	| "circle-overlay"
	| "player-name"
	| "shirt-number";

export type PlayerPortraitTemplateDefinition =
	EditableTemplateLayout<PlayerPortraitElementId>;

export const playerPortraitDefaultDefinition: PlayerPortraitTemplateDefinition = {
	version: 1,
	canvas: { width: 1254, height: 1254, sponsorFreeHeight: 1254 },
	elements: {
		background: { x: 0, y: 0, width: 1254, height: 1254 },
		"player-image": { x: 105, y: 90, width: 1044, height: 1164 },
		"circle-overlay": { x: 0, y: 0, width: 1254, height: 1254 },
		"player-name": { x: 72, y: 1100, width: 920, height: 90 },
		"shirt-number": { x: 1012, y: 1062, width: 170, height: 120 },
	},
};

export const playerPortraitDefaultSource = serializeEditableTemplateLayout(
	playerPortraitDefaultDefinition
);

export const playerPortraitTemplate = createPlayerPortraitTemplate();

export function createPlayerPortraitTemplate(
	definition = playerPortraitDefaultDefinition
): SocialGraphicTemplate {
	return {
		id: "player-portrait-club",
		name: "Club player portrait",
		description: "Place a player cutout over a square club background.",
		width: definition.canvas.width,
		height: definition.canvas.height,
		supportedKinds: ["playerPortrait"],
		fields: [
			{
				id: "showPlayerName",
				label: "Show player name",
				type: "boolean",
				defaultValue: false,
			},
			{
				id: "playerName",
				label: "Player name",
				type: "text",
				defaultValue: "",
				placeholder: "Player name",
			},
			{
				id: "showShirtNumber",
				label: "Show shirt number",
				type: "boolean",
				defaultValue: false,
			},
			{
				id: "shirtNumber",
				label: "Shirt number",
				type: "text",
				defaultValue: "",
				placeholder: "10",
			},
		],
		render: (context) => renderPlayerPortrait(context, definition),
	};
}

export function parsePlayerPortraitDefinition(source: string) {
	return parseEditableTemplateLayout(
		addMissingCircleOverlay(source),
		playerPortraitDefaultDefinition
	);
}

export const serializePlayerPortraitDefinition = serializeEditableTemplateLayout;

function addMissingCircleOverlay(source: string) {
	let candidate: unknown;
	try {
		candidate = JSON.parse(source);
	} catch {
		return source;
	}
	if (
		typeof candidate !== "object" ||
		candidate === null ||
		!("elements" in candidate) ||
		typeof candidate.elements !== "object" ||
		candidate.elements === null ||
		Array.isArray(candidate.elements) ||
		"circle-overlay" in candidate.elements
	) {
		return source;
	}

	return JSON.stringify({
		...candidate,
		elements: {
			...candidate.elements,
			"circle-overlay": playerPortraitDefaultDefinition.elements["circle-overlay"],
		},
	});
}

async function renderPlayerPortrait(
	{ context, width, height, content }: SocialGraphicTemplateRenderContext,
	definition: PlayerPortraitTemplateDefinition
) {
	context.clearRect(0, 0, width, height);

	if (content.assets.backgroundImage) {
		await withElementTransformAsync(
			context,
			playerPortraitDefaultDefinition.elements.background,
			definition.elements.background,
			async () => {
				const background = await loadTemplateImage(
					content.assets.backgroundImage!.source
				);
				context.drawImage(background, 0, 0, 1254, 1254);
			}
		);
	} else {
		context.fillStyle = "#07111f";
		context.fillRect(0, 0, width, height);
	}

	if (content.assets.featuredImage) {
		await withElementTransformAsync(
			context,
			playerPortraitDefaultDefinition.elements["player-image"],
			definition.elements["player-image"],
			async () => {
				const playerImage = await loadTemplateImage(
					content.assets.featuredImage!.source
				);
				drawImageContain(context, playerImage, 105, 90, 1044, 1164);
			}
		);
	} else {
		context.save();
		context.fillStyle = "rgba(4, 11, 22, 0.72)";
		context.fillRect(255, 420, 744, 160);
		drawFittedText(
			context,
			"ADD A PLAYER PHOTO",
			627,
			458,
			650,
			48,
			26,
			EDITORIAL_WHITE,
			"center"
		);
		context.restore();
	}

	await withElementTransformAsync(
		context,
		playerPortraitDefaultDefinition.elements["circle-overlay"],
		definition.elements["circle-overlay"],
		async () => {
			const circleOverlay = await loadCircleOverlay();
			context.drawImage(circleOverlay, 0, 0, 1254, 1254);
		}
	);

	if (content.fields.showPlayerName === true) {
		const name = getTextField(content.fields.playerName, "Player name");
		withElementTransform(
			context,
			playerPortraitDefaultDefinition.elements["player-name"],
			definition.elements["player-name"],
			() => {
				context.save();
				context.fillStyle = "rgba(4, 11, 22, 0.78)";
				context.fillRect(56, 1084, 952, 122);
				drawFittedText(
					context,
					name.toUpperCase(),
					72,
					1100,
					920,
					64,
					28,
					EDITORIAL_WHITE
				);
				context.restore();
			}
		);
	}

	if (content.fields.showShirtNumber === true) {
		const shirtNumber = getTextField(content.fields.shirtNumber, "-");
		withElementTransform(
			context,
			playerPortraitDefaultDefinition.elements["shirt-number"],
			definition.elements["shirt-number"],
			() => drawFittedText(
				context,
				shirtNumber,
				1097,
				1062,
				170,
				112,
				46,
				EDITORIAL_GOLD,
				"center"
			)
		);
	}
}

let circleOverlayPromise: Promise<HTMLCanvasElement> | undefined;

function loadCircleOverlay() {
	circleOverlayPromise ??= createCircleOverlay();
	return circleOverlayPromise;
}

async function createCircleOverlay() {
	const [withCircle, withoutCircle] = await Promise.all([
		loadTemplateImage(playerTemplateWithCircle),
		loadTemplateImage(playerTemplateWithoutCircle),
	]);
	const width = playerPortraitDefaultDefinition.canvas.width;
	const height = playerPortraitDefaultDefinition.canvas.height;
	const comparisonCanvas = document.createElement("canvas");
	comparisonCanvas.width = width;
	comparisonCanvas.height = height;
	const comparisonContext = comparisonCanvas.getContext("2d", {
		willReadFrequently: true,
	});
	if (!comparisonContext) {
		throw new Error("This browser cannot create the player template overlay.");
	}

	comparisonContext.drawImage(withoutCircle, 0, 0, width, height);
	const withoutCirclePixels = comparisonContext.getImageData(0, 0, width, height);
	comparisonContext.clearRect(0, 0, width, height);
	comparisonContext.drawImage(withCircle, 0, 0, width, height);
	const withCirclePixels = comparisonContext.getImageData(0, 0, width, height);
	const overlayPixels = createDifferenceOverlayPixels(
		withCirclePixels.data,
		withoutCirclePixels.data
	);
	comparisonContext.putImageData(
		new ImageData(overlayPixels, width, height),
		0,
		0
	);
	return comparisonCanvas;
}

export function createDifferenceOverlayPixels(
	withOverlay: Uint8ClampedArray,
	withoutOverlay: Uint8ClampedArray,
	differenceThreshold = 12
) {
	if (withOverlay.length !== withoutOverlay.length) {
		throw new Error("Template layers must have matching dimensions.");
	}

	const result = new Uint8ClampedArray(withOverlay.length);
	for (let index = 0; index < withOverlay.length; index += 4) {
		const difference = Math.max(
			Math.abs(withOverlay[index] - withoutOverlay[index]),
			Math.abs(withOverlay[index + 1] - withoutOverlay[index + 1]),
			Math.abs(withOverlay[index + 2] - withoutOverlay[index + 2])
		);
		result[index] = withOverlay[index];
		result[index + 1] = withOverlay[index + 1];
		result[index + 2] = withOverlay[index + 2];
		result[index + 3] = difference >= differenceThreshold
			? withOverlay[index + 3]
			: 0;
	}
	return result;
}
