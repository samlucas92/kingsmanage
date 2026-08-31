type RgbColour = {
	red: number;
	green: number;
	blue: number;
};

export type BackgroundRemovalOptions = {
	tolerance?: number;
	feather?: number;
	maxDimension?: number;
};

const DEFAULT_TOLERANCE = 54;
const DEFAULT_FEATHER = 20;
const DEFAULT_MAX_DIMENSION = 1600;

export async function removeImageBackground(
	file: File,
	options: BackgroundRemovalOptions = {}
) {
	const image = await loadFileImage(file);
	const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
	const scale = Math.min(
		1,
		maxDimension / Math.max(image.naturalWidth, image.naturalHeight)
	);
	const width = Math.max(1, Math.round(image.naturalWidth * scale));
	const height = Math.max(1, Math.round(image.naturalHeight * scale));
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d", { willReadFrequently: true });
	if (!context) throw new Error("This browser cannot process the player image.");

	context.drawImage(image, 0, 0, width, height);
	const imageData = context.getImageData(0, 0, width, height);
	const palette = buildEdgePalette(imageData.data, width, height);
	applyEdgeConnectedMask(
		imageData.data,
		width,
		height,
		palette,
		options.tolerance ?? DEFAULT_TOLERANCE,
		options.feather ?? DEFAULT_FEATHER
	);
	context.putImageData(imageData, 0, 0);

	const blob = await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob((result) => {
			if (result) resolve(result);
			else reject(new Error("The processed player image could not be created."));
		}, "image/png");
	});

	return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}-cutout.png`, {
		type: "image/png",
	});
}

export function calculateBackgroundAlpha(
	originalAlpha: number,
	distance: number,
	tolerance: number,
	feather: number
) {
	if (distance <= tolerance) return 0;
	if (feather <= 0 || distance >= tolerance + feather) return originalAlpha;
	return Math.round(originalAlpha * (distance - tolerance) / feather);
}

function loadFileImage(file: File) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const source = URL.createObjectURL(file);
		const image = new Image();
		image.onload = () => {
			URL.revokeObjectURL(source);
			resolve(image);
		};
		image.onerror = () => {
			URL.revokeObjectURL(source);
			reject(new Error("The selected player image could not be read."));
		};
		image.src = source;
	});
}

function buildEdgePalette(
	pixels: Uint8ClampedArray,
	width: number,
	height: number
) {
	const samples: RgbColour[] = [];
	const horizontalStep = Math.max(1, Math.floor(width / 24));
	const verticalStep = Math.max(1, Math.floor(height / 24));

	for (let x = 0; x < width; x += horizontalStep) {
		samples.push(readColour(pixels, x));
		if (x < width * 0.2 || x > width * 0.8) {
			samples.push(readColour(pixels, (height - 1) * width + x));
		}
	}
	for (let y = 0; y < height; y += verticalStep) {
		samples.push(readColour(pixels, y * width));
		samples.push(readColour(pixels, y * width + width - 1));
	}

	return clusterColours(samples, 22, 28);
}

function clusterColours(
	samples: RgbColour[],
	mergeDistance: number,
	maximumColours: number
) {
	const clusters: Array<RgbColour & { count: number }> = [];
	for (const sample of samples) {
		const cluster = clusters.find(
			(candidate) => colourDistance(candidate, sample) <= mergeDistance
		);
		if (!cluster) {
			clusters.push({ ...sample, count: 1 });
			continue;
		}

		cluster.red = (cluster.red * cluster.count + sample.red) / (cluster.count + 1);
		cluster.green = (cluster.green * cluster.count + sample.green) / (cluster.count + 1);
		cluster.blue = (cluster.blue * cluster.count + sample.blue) / (cluster.count + 1);
		cluster.count += 1;
	}

	return clusters
		.sort((first, second) => second.count - first.count)
		.slice(0, maximumColours)
		.map(({ red, green, blue }) => ({ red, green, blue }));
}

function applyEdgeConnectedMask(
	pixels: Uint8ClampedArray,
	width: number,
	height: number,
	palette: RgbColour[],
	tolerance: number,
	feather: number
) {
	const pixelCount = width * height;
	const queued = new Uint8Array(pixelCount);
	const queue = new Int32Array(pixelCount);
	let queueStart = 0;
	let queueEnd = 0;
	const maximumDistance = tolerance + feather;

	const enqueue = (pixelIndex: number) => {
		if (queued[pixelIndex] === 1) return;
		const distance = minimumPaletteDistance(
			readColour(pixels, pixelIndex),
			palette
		);
		if (distance > maximumDistance) return;
		queued[pixelIndex] = 1;
		queue[queueEnd] = pixelIndex;
		queueEnd += 1;
	};

	for (let x = 0; x < width; x += 1) {
		enqueue(x);
		if (x < width * 0.2 || x > width * 0.8) {
			enqueue((height - 1) * width + x);
		}
	}
	for (let y = 0; y < height; y += 1) {
		enqueue(y * width);
		enqueue(y * width + width - 1);
	}

	while (queueStart < queueEnd) {
		const pixelIndex = queue[queueStart];
		queueStart += 1;
		const x = pixelIndex % width;
		const y = Math.floor(pixelIndex / width);
		const distance = minimumPaletteDistance(
			readColour(pixels, pixelIndex),
			palette
		);
		const alphaIndex = pixelIndex * 4 + 3;
		pixels[alphaIndex] = calculateBackgroundAlpha(
			pixels[alphaIndex],
			distance,
			tolerance,
			feather
		);

		if (x > 0) enqueue(pixelIndex - 1);
		if (x < width - 1) enqueue(pixelIndex + 1);
		if (y > 0) enqueue(pixelIndex - width);
		if (y < height - 1) enqueue(pixelIndex + width);
	}
}

function readColour(pixels: Uint8ClampedArray, pixelIndex: number): RgbColour {
	return {
		red: pixels[pixelIndex * 4],
		green: pixels[pixelIndex * 4 + 1],
		blue: pixels[pixelIndex * 4 + 2],
	};
}

function minimumPaletteDistance(colour: RgbColour, palette: RgbColour[]) {
	return palette.reduce(
		(minimum, candidate) => Math.min(minimum, colourDistance(colour, candidate)),
		Number.POSITIVE_INFINITY
	);
}

function colourDistance(first: RgbColour, second: RgbColour) {
	const redMean = (first.red + second.red) / 2;
	const red = first.red - second.red;
	const green = first.green - second.green;
	const blue = first.blue - second.blue;
	return Math.sqrt(
		(2 + redMean / 256) * red * red +
		4 * green * green +
		(2 + (255 - redMean) / 256) * blue * blue
	) / 2;
}
