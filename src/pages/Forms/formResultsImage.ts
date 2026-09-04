import type { ClubFormOptionResult, ClubFormResults } from "../../types/forms";
import { createBrandTheme } from "../../utils/brandTheme";
import { slugify } from "../../services/exportService";

export type FormResultsGraphicQuestion = {
	questionId: string;
	prompt: string;
	responseCount: number;
	rankedOptions: ClubFormOptionResult[];
	winners: ClubFormOptionResult[];
	averageRating?: number | null;
	textResponseCount: number;
};

export type FormResultsGraphicData = {
	title: string;
	submissionCount: number;
	questions: FormResultsGraphicQuestion[];
};

const width = 1080;
const minimumHeight = 1080;
const pagePadding = 72;
const questionCardHeight = 400;
const questionGap = 24;

export function buildFormResultsGraphicData(results: ClubFormResults): FormResultsGraphicData {
	return {
		title: results.title,
		submissionCount: results.submissionCount,
		questions: results.questions.map((question) => {
			const rankedOptions = [...question.options]
				.filter((option) => option.count > 0)
				.sort((left, right) =>
					right.count - left.count || optionLabel(left).localeCompare(optionLabel(right))
				);
			const winningCount = rankedOptions[0]?.count ?? 0;

			return {
				questionId: question.questionId,
				prompt: question.prompt,
				responseCount: question.responseCount,
				rankedOptions,
				winners: rankedOptions.filter((option) => option.count === winningCount),
				averageRating: question.averageRating,
				textResponseCount: question.textResponses.length,
			};
		}),
	};
}

export function getFormResultsImageFilename(clubName: string, formTitle: string) {
	return `${slugify(clubName) || "club"}-${slugify(formTitle) || "form"}-results.png`;
}

export async function downloadFormResultsImage({
	clubName,
	primaryColor,
	secondaryColor,
	results,
}: {
	clubName: string;
	primaryColor: string;
	secondaryColor: string;
	results: ClubFormResults;
}) {
	if (document.fonts?.ready) await document.fonts.ready;

	const data = buildFormResultsGraphicData(results);
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = Math.max(
		minimumHeight,
		430 + data.questions.length * questionCardHeight + Math.max(0, data.questions.length - 1) * questionGap
	);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("This browser cannot create the results image.");

	renderFormResultsGraphic(context, canvas, data, {
		clubName,
		primaryColor,
		secondaryColor,
	});

	const blob = await canvasToPng(canvas);
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = getFormResultsImageFilename(clubName, results.title);
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

function renderFormResultsGraphic(
	context: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	data: FormResultsGraphicData,
	brand: { clubName: string; primaryColor: string; secondaryColor: string }
) {
	const theme = createBrandTheme(brand.primaryColor, brand.secondaryColor);
	const background = theme["--color-yepset-950"];
	const primary = theme["--color-yepset-500"];
	const accent = theme["--color-kick-400"];
	const accentText = contrastText(accent);
	const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
	gradient.addColorStop(0, background);
	gradient.addColorStop(1, theme["--color-yepset-900"]);
	context.fillStyle = gradient;
	context.fillRect(0, 0, canvas.width, canvas.height);

	context.save();
	context.globalAlpha = 0.12;
	context.fillStyle = accent;
	context.beginPath();
	context.arc(canvas.width - 40, 80, 260, 0, Math.PI * 2);
	context.fill();
	context.restore();

	drawClubMark(context, brand.clubName, accent, accentText);
	context.fillStyle = "#ffffff";
	context.font = font(20, 800);
	context.fillText(brand.clubName.toUpperCase(), 150, 96, 640);
	context.fillStyle = accent;
	context.font = font(18, 900);
	context.fillText("CLUB VOTE RESULTS", pagePadding, 166);
	context.fillStyle = "#ffffff";
	drawWrappedText(context, data.title, pagePadding, 218, width - pagePadding * 2, 46, 2);
	context.fillStyle = "rgba(255,255,255,.68)";
	context.font = font(18, 700);
	context.fillText(
		`${data.submissionCount} ${data.submissionCount === 1 ? "submission" : "submissions"} · Final standings`,
		pagePadding,
		300
	);

	if (data.questions.length === 0) {
		drawEmptyCard(context, 340, "No result questions are available yet.");
	} else {
		data.questions.forEach((question, index) => {
			drawQuestionCard(
				context,
				question,
				340 + index * (questionCardHeight + questionGap),
				primary,
				accent,
				accentText,
				index + 1
			);
		});
	}

	context.fillStyle = "rgba(255,255,255,.55)";
	context.font = font(15, 700);
	context.textAlign = "center";
	context.fillText("Created with Yepset · Club together", canvas.width / 2, canvas.height - 38);
	context.textAlign = "left";
}

function drawQuestionCard(
	context: CanvasRenderingContext2D,
	question: FormResultsGraphicQuestion,
	y: number,
	primary: string,
	accent: string,
	accentText: string,
	questionNumber: number
) {
	const x = pagePadding;
	const cardWidth = width - pagePadding * 2;
	roundedRect(context, x, y, cardWidth, questionCardHeight, 30);
	context.fillStyle = "#ffffff";
	context.fill();

	context.fillStyle = primary;
	context.font = font(16, 900);
	context.fillText(`RESULT ${questionNumber}`, x + 34, y + 45);
	context.fillStyle = "#0f172a";
	drawWrappedText(context, question.prompt, x + 34, y + 84, cardWidth - 230, 28, 2);
	context.fillStyle = "#64748b";
	context.font = font(15, 800);
	context.textAlign = "right";
	context.fillText(
		`${question.responseCount} ${question.rankedOptions.length > 0 ? "votes" : "responses"}`,
		x + cardWidth - 34,
		y + 45
	);
	context.textAlign = "left";

	if (question.rankedOptions.length > 0) {
		drawRankedResult(context, question, x, y, cardWidth, accent, accentText);
		return;
	}

	context.fillStyle = "#f1f5f9";
	roundedRect(context, x + 34, y + 168, cardWidth - 68, 166, 22);
	context.fill();
	context.fillStyle = primary;
	context.font = font(18, 900);
	context.fillText(question.averageRating != null ? "AVERAGE RATING" : "WRITTEN RESPONSES", x + 62, y + 214);
	context.fillStyle = "#0f172a";
	context.font = font(48, 900);
	context.fillText(
		question.averageRating != null ? String(question.averageRating) : String(question.textResponseCount),
		x + 62,
		y + 282
	);
}

function drawRankedResult(
	context: CanvasRenderingContext2D,
	question: FormResultsGraphicQuestion,
	x: number,
	y: number,
	cardWidth: number,
	accent: string,
	accentText: string
) {
	const winnerLabel = question.winners.length > 1 ? "TIED WINNERS" : "WINNER";
	const winnerNames = question.winners.map(optionLabel).join(" / ");
	const winnerCount = question.winners[0]?.count ?? 0;
	const winnerPercentage = question.responseCount > 0
		? Math.round((winnerCount / question.responseCount) * 100)
		: 0;

	context.fillStyle = accent;
	roundedRect(context, x + 34, y + 154, cardWidth - 68, 112, 22);
	context.fill();
	context.fillStyle = accentText;
	context.font = font(15, 900);
	context.fillText(winnerLabel, x + 60, y + 188);
	drawFittedText(context, winnerNames, x + 60, y + 235, cardWidth - 330, 36, 20, 900);
	context.textAlign = "right";
	context.font = font(32, 900);
	context.fillText(`${winnerPercentage}%`, x + cardWidth - 60, y + 218);
	context.font = font(13, 800);
	context.fillText(`${winnerCount} ${winnerCount === 1 ? "vote" : "votes"}`, x + cardWidth - 60, y + 241);
	context.textAlign = "left";

	question.rankedOptions.slice(0, 3).forEach((option, index) => {
		const rowY = y + 304 + index * 28;
		context.fillStyle = index === 0 ? "#0f172a" : "#475569";
		context.font = font(16, index === 0 ? 900 : 750);
		context.fillText(`${index + 1}`, x + 42, rowY);
		drawFittedText(context, optionLabel(option), x + 72, rowY, cardWidth - 250, 16, 12, index === 0 ? 900 : 750);
		context.textAlign = "right";
		context.fillText(`${option.count}`, x + cardWidth - 42, rowY);
		context.textAlign = "left";
	});
}

function drawClubMark(context: CanvasRenderingContext2D, clubName: string, accent: string, textColor: string) {
	context.fillStyle = accent;
	context.beginPath();
	context.arc(104, 88, 32, 0, Math.PI * 2);
	context.fill();
	context.fillStyle = textColor;
	context.font = font(24, 900);
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillText(clubName.trim().charAt(0).toUpperCase() || "Y", 104, 89);
	context.textAlign = "left";
	context.textBaseline = "alphabetic";
}

function drawEmptyCard(context: CanvasRenderingContext2D, y: number, message: string) {
	roundedRect(context, pagePadding, y, width - pagePadding * 2, 220, 30);
	context.fillStyle = "#ffffff";
	context.fill();
	context.fillStyle = "#475569";
	context.font = font(24, 800);
	context.fillText(message, pagePadding + 40, y + 116);
}

function drawWrappedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, fontSize: number, maxLines: number) {
	context.font = font(fontSize, 900);
	const words = text.trim().split(/\s+/);
	const lines: string[] = [];
	let line = "";
	for (const word of words) {
		const candidate = line ? `${line} ${word}` : word;
		if (line && context.measureText(candidate).width > maxWidth) {
			lines.push(line);
			line = word;
		} else {
			line = candidate;
		}
	}
	if (line) lines.push(line);
	lines.slice(0, maxLines).forEach((item, index) => {
		drawFittedText(context, item, x, y + index * fontSize * 1.15, maxWidth, fontSize, 16, 900);
	});
}

function drawFittedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, preferredSize: number, minimumSize: number, weight: number) {
	let size = preferredSize;
	while (size > minimumSize) {
		context.font = font(size, weight);
		if (context.measureText(text).width <= maxWidth) break;
		size -= 1;
	}
	context.fillText(text, x, y, maxWidth);
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, rectWidth: number, height: number, radius: number) {
	const safeRadius = Math.min(radius, rectWidth / 2, height / 2);
	context.beginPath();
	context.moveTo(x + safeRadius, y);
	context.arcTo(x + rectWidth, y, x + rectWidth, y + height, safeRadius);
	context.arcTo(x + rectWidth, y + height, x, y + height, safeRadius);
	context.arcTo(x, y + height, x, y, safeRadius);
	context.arcTo(x, y, x + rectWidth, y, safeRadius);
	context.closePath();
}

function canvasToPng(canvas: HTMLCanvasElement) {
	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) resolve(blob);
			else reject(new Error("The browser could not create a PNG from these results."));
		}, "image/png");
	});
}

function optionLabel(option: ClubFormOptionResult) {
	return option.label || option.value;
}

function font(size: number, weight: number) {
	return `${weight} ${size}px Inter, ui-sans-serif, system-ui, sans-serif`;
}

function contrastText(hex: string) {
	const value = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#facc15";
	const red = Number.parseInt(value.slice(1, 3), 16);
	const green = Number.parseInt(value.slice(3, 5), 16);
	const blue = Number.parseInt(value.slice(5, 7), 16);
	return (red * 299 + green * 587 + blue * 114) / 1000 > 150 ? "#0f172a" : "#ffffff";
}
