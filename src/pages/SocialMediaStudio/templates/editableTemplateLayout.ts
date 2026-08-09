export type EditableTemplateBounds = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type EditableTemplateLayout<ElementId extends string> = {
	version: 1;
	canvas: {
		width: number;
		height: number;
		sponsorFreeHeight: number;
	};
	elements: Record<ElementId, EditableTemplateBounds>;
};

export function parseEditableTemplateLayout<ElementId extends string>(
	source: string,
	defaults: EditableTemplateLayout<ElementId>
): EditableTemplateLayout<ElementId> {
	let candidate: unknown;
	try {
		candidate = JSON.parse(source);
	} catch (error) {
		throw new Error(
			error instanceof SyntaxError ? error.message : "Template JSON is invalid.",
			{ cause: error }
		);
	}

	if (!isRecord(candidate) || candidate.version !== 1) {
		throw new Error("Template version must be 1.");
	}
	if (!isRecord(candidate.canvas) || !isRecord(candidate.elements)) {
		throw new Error("Template canvas and elements are required.");
	}

	const canvas = {
		width: positiveNumber(candidate.canvas.width, "canvas.width"),
		height: positiveNumber(candidate.canvas.height, "canvas.height"),
		sponsorFreeHeight: positiveNumber(
			candidate.canvas.sponsorFreeHeight,
			"canvas.sponsorFreeHeight"
		),
	};
	if (canvas.sponsorFreeHeight > canvas.height) {
		throw new Error("canvas.sponsorFreeHeight cannot exceed canvas.height.");
	}

	const elements = {} as Record<ElementId, EditableTemplateBounds>;
	for (const id of Object.keys(defaults.elements) as ElementId[]) {
		const value = candidate.elements[id];
		if (!isRecord(value)) throw new Error(`elements.${id} is required.`);
		const bounds = {
			x: finiteNumber(value.x, `elements.${id}.x`),
			y: finiteNumber(value.y, `elements.${id}.y`),
			width: positiveNumber(value.width, `elements.${id}.width`),
			height: positiveNumber(value.height, `elements.${id}.height`),
		};
		if (bounds.x < 0 || bounds.y < 0 || bounds.x + bounds.width > canvas.width || bounds.y + bounds.height > canvas.height) {
			throw new Error(`elements.${id} must stay within the canvas.`);
		}
		elements[id] = bounds;
	}

	return { version: 1, canvas, elements };
}

export function serializeEditableTemplateLayout<ElementId extends string>(
	definition: EditableTemplateLayout<ElementId>
) {
	return `${JSON.stringify(definition, null, "\t")}\n`;
}

export function withElementTransform(
	context: CanvasRenderingContext2D,
	from: EditableTemplateBounds,
	to: EditableTemplateBounds,
	draw: () => void
) {
	context.save();
	context.translate(to.x, to.y);
	context.scale(to.width / from.width, to.height / from.height);
	context.translate(-from.x, -from.y);
	draw();
	context.restore();
}

export async function withElementTransformAsync(
	context: CanvasRenderingContext2D,
	from: EditableTemplateBounds,
	to: EditableTemplateBounds,
	draw: () => Promise<void>
) {
	context.save();
	context.translate(to.x, to.y);
	context.scale(to.width / from.width, to.height / from.height);
	context.translate(-from.x, -from.y);
	try {
		await draw();
	} finally {
		context.restore();
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown, path: string) {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		throw new Error(`${path} must be a finite number.`);
	}
	return value;
}

function positiveNumber(value: unknown, path: string) {
	const result = finiteNumber(value, path);
	if (result <= 0) throw new Error(`${path} must be greater than zero.`);
	return result;
}
