import type {
	SocialGraphicTemplate,
	SocialGraphicTemplateRenderContext,
} from "../types";
import {
	drawAssetOrPlaceholder,
	drawEditorialBackground,
	drawEditorialBorder,
	drawEditorialSectionTitle,
	drawFittedText,
	drawWrappedText,
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
import { getSponsorSlots } from "./sponsorLayout";

const BLANK_SPONSOR_TOP = 1365;
const BLANK_SPONSOR_FREE_HEIGHT = 1365;

export type BlankEditorialElementId =
	| "headline"
	| "club-crest"
	| "featured-area"
	| "supporting-text"
	| "footer"
	| "sponsor-section";

export type BlankEditorialTemplateDefinition = EditableTemplateLayout<BlankEditorialElementId>;

export const blankEditorialDefaultDefinition: BlankEditorialTemplateDefinition = {
	version: 1,
	canvas: { width: 1365, height: 1651, sponsorFreeHeight: BLANK_SPONSOR_FREE_HEIGHT },
	elements: {
		headline: { x: 72, y: 82, width: 920, height: 230 },
		"club-crest": { x: 1050, y: 68, width: 230, height: 260 },
		"featured-area": { x: 92, y: 370, width: 1181, height: 650 },
		"supporting-text": { x: 100, y: 1060, width: 1165, height: 170 },
		footer: { x: 100, y: 1258, width: 1165, height: 54 },
		"sponsor-section": { x: 64, y: BLANK_SPONSOR_TOP - 34, width: 1237, height: 270 },
	},
};

export const blankEditorialDefaultSource = serializeEditableTemplateLayout(
	blankEditorialDefaultDefinition
);

export const blankEditorialTemplate = createBlankEditorialTemplate();

export function createBlankEditorialTemplate(
	definition = blankEditorialDefaultDefinition
): SocialGraphicTemplate {
	return {
		id: "blank-editorial-gold",
		name: "Blank editorial canvas",
		description: "A clean black and gold club canvas with optional text, imagery and sponsors.",
		width: definition.canvas.width,
		height: definition.canvas.height,
		resolveHeight: (content) => content.fields.showSponsors === true
			? definition.canvas.height
			: definition.canvas.sponsorFreeHeight,
		supportedKinds: ["blank"],
		fields: [
			{ id: "title", label: "Title", type: "text", defaultValue: "", placeholder: "Add a title" },
			{ id: "supportingText", label: "Supporting text", type: "textarea", defaultValue: "", placeholder: "Add any supporting copy" },
			{ id: "footerText", label: "Footer", type: "text", defaultValue: "", placeholder: "Add an optional footer" },
			{ id: "showClubLogo", label: "Show club logo", type: "boolean", defaultValue: false },
			{ id: "showFeaturedImage", label: "Show main image", type: "boolean", defaultValue: false },
			{ id: "showSponsors", label: "Show sponsors area", type: "boolean", defaultValue: false },
			{ id: "sponsorsTitle", label: "Sponsors title", type: "text", defaultValue: "Proudly sponsored by" },
		],
		render: (context) => renderBlankEditorialTemplate(context, definition),
	};
}

export function parseBlankEditorialDefinition(source: string) {
	return parseEditableTemplateLayout(source, blankEditorialDefaultDefinition);
}

export const serializeBlankEditorialDefinition = serializeEditableTemplateLayout;

async function renderBlankEditorialTemplate({
	context,
	width,
	height,
	content,
}: SocialGraphicTemplateRenderContext, definition: BlankEditorialTemplateDefinition) {
	const title = getTextField(content.fields.title, "");
	const supportingText = getTextField(content.fields.supportingText, "");
	const footerText = getTextField(content.fields.footerText, "");
	const showClubLogo = content.fields.showClubLogo === true;
	const showFeaturedImage = content.fields.showFeaturedImage === true;
	const showSponsors = content.fields.showSponsors === true;

	context.save();
	drawEditorialBackground(context, width, height);
	drawEditorialBorder(context, width, height);

	if (title) {
		withElementTransform(
			context,
			blankEditorialDefaultDefinition.elements.headline,
			definition.elements.headline,
			() => drawFittedText(context, title.toUpperCase(), 72, 82, 920, 210, 74, EDITORIAL_WHITE)
		);
	}

	if (showClubLogo && content.assets.homeTeamLogo) {
		await withElementTransformAsync(
			context,
			blankEditorialDefaultDefinition.elements["club-crest"],
			definition.elements["club-crest"],
			() => drawAssetOrPlaceholder(context, content.assets.homeTeamLogo, 1050, 68, 230, 260, "", {
				frame: false,
				contain: true,
			})
		);
	}

	if (showFeaturedImage && content.assets.featuredImage) {
		await withElementTransformAsync(
			context,
			blankEditorialDefaultDefinition.elements["featured-area"],
			definition.elements["featured-area"],
			() => drawAssetOrPlaceholder(
				context,
				content.assets.featuredImage,
				92,
				370,
				1181,
				650,
				""
			)
		);
	}

	if (supportingText) {
		withElementTransform(
			context,
			blankEditorialDefaultDefinition.elements["supporting-text"],
			definition.elements["supporting-text"],
			() => drawWrappedText(
				context,
				supportingText,
				100,
				1060,
				1165,
				4,
				46,
				18,
				EDITORIAL_WHITE,
				"left",
				blankEditorialDefaultDefinition.elements["supporting-text"].height
			)
		);
	}

	if (footerText) {
		withElementTransform(
			context,
			blankEditorialDefaultDefinition.elements.footer,
			definition.elements.footer,
			() => drawFittedText(context, footerText, 100, 1258, 1165, 38, 22, EDITORIAL_GOLD)
		);
	}

	if (showSponsors) {
		await withElementTransformAsync(
			context,
			blankEditorialDefaultDefinition.elements["sponsor-section"],
			definition.elements["sponsor-section"],
			async () => {
				drawEditorialSectionTitle(
					context,
					getTextField(content.fields.sponsorsTitle, "Proudly sponsored by"),
					BLANK_SPONSOR_TOP,
					width,
					530
				);
				const slots = getSponsorSlots(content.assets.sponsors, 64, 1237, 33);
				await Promise.all(slots.map((slot) => drawAssetOrPlaceholder(
					context,
					slot.asset,
					slot.x,
					BLANK_SPONSOR_TOP + 35,
					slot.width,
					190,
					"",
					{ contain: true }
				)));
			}
		);
	}

	context.restore();
}
