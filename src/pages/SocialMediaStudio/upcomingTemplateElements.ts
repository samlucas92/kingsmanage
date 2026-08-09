import {
	getUpcomingFixtureRowLayouts,
} from "./templates/upcomingEditorialTemplate";
import type { UpcomingEditorialTemplateDefinition } from "./templates/upcomingEditorialTemplate";

export type TemplateElementBounds = {
	x: number;
	y: number;
	width: number;
	height: number;
};

type UpcomingTopLevelElementId =
	| "section-heading"
	| "headline"
	| "club-crest"
	| "fixture-list"
	| "sponsor-section";

type UpcomingFixtureChildType =
	| "calendar"
	| "date"
	| "crest"
	| "versus"
	| "opponent"
	| "location-icon"
	| "location";

export type UpcomingTemplateElementId =
	| UpcomingTopLevelElementId
	| `fixture-row:${number}`
	| `fixture-${UpcomingFixtureChildType}:${number}`;

export type UpcomingTemplateElement = TemplateElementBounds & {
	id: UpcomingTemplateElementId;
	label: string;
	minimumWidth: number;
	minimumHeight: number;
	resizeMode?: "both" | "horizontal" | "square" | "none";
	parentId?: UpcomingTemplateElementId;
	drillable?: boolean;
	sharedAcrossRows?: boolean;
	constraint?: TemplateElementBounds;
};

export function getUpcomingTemplateElements(
	definition: UpcomingEditorialTemplateDefinition,
	includeSponsors: boolean,
	fixtureCount = 0,
	selectedId: UpcomingTemplateElementId | null = null
): UpcomingTemplateElement[] {
	const topLevelElements = getTopLevelElements(definition, includeSponsors);
	const selectedRowIndex = getFixtureRowIndex(selectedId);

	if (selectedRowIndex !== null) {
		const rowElement = getFixtureRowElement(definition, fixtureCount, selectedRowIndex);
		return rowElement
			? [rowElement, ...getFixtureRowChildren(definition, rowElement, selectedRowIndex)]
			: topLevelElements;
	}

	if (selectedId === "fixture-list" && fixtureCount > 0) {
		const fixtureList = topLevelElements.find((element) => element.id === "fixture-list");
		const rows = getUpcomingFixtureRowLayouts(definition, fixtureCount).map(
			(_, index) => getFixtureRowElement(definition, fixtureCount, index)
		).filter((element): element is UpcomingTemplateElement => Boolean(element));
		return fixtureList ? [fixtureList, ...rows] : rows;
	}

	return topLevelElements;
}

export function getUpcomingTemplateParentId(
	elementId: UpcomingTemplateElementId
): UpcomingTemplateElementId | null {
	const childParts = getFixtureChildParts(elementId);
	if (childParts) return `fixture-row:${childParts.rowIndex}`;
	if (isFixtureRowId(elementId)) return "fixture-list";
	return null;
}

export function updateUpcomingTemplateElement(
	definition: UpcomingEditorialTemplateDefinition,
	elementId: UpcomingTemplateElementId,
	bounds: TemplateElementBounds,
	fixtureCount = 0
): UpcomingEditorialTemplateDefinition {
	const childParts = getFixtureChildParts(elementId);
	if (childParts) {
		return updateFixtureRowChild(
			definition,
			childParts.type,
			childParts.rowIndex,
			bounds,
			fixtureCount
		);
	}

	const rowIndex = isFixtureRowId(elementId) ? getFixtureRowIndex(elementId) : null;
	if (rowIndex !== null) {
		const rowLayout = getUpcomingFixtureRowLayouts(definition, fixtureCount)[rowIndex];
		if (!rowLayout) return definition;
		const horizontalOffset = bounds.x - definition.fixtureRow.frameX;
		const verticalOffset = bounds.y - rowLayout.y;
		return {
			...definition,
			fixtureList: {
				...definition.fixtureList,
				top: definition.fixtureList.top + verticalOffset,
				bottom: definition.fixtureList.bottom + verticalOffset,
				maximumRowHeight: bounds.height,
			},
			fixtureRow: shiftFixtureRowHorizontally(
				definition.fixtureRow,
				horizontalOffset,
				bounds.x,
				bounds.width
			),
		};
	}

	switch (elementId) {
		case "section-heading":
			return {
				...definition,
				header: {
					...definition.header,
					sectionX: bounds.x + bounds.width / 2,
					sectionY: bounds.y + 34,
					sectionWidth: bounds.width,
				},
			};
		case "headline":
			return {
				...definition,
				header: {
					...definition.header,
					headlineX: bounds.x,
					headlineY: bounds.y,
					headlineWidth: bounds.width,
					headlineMaxFontSize: bounds.height,
					headlineMinFontSize: Math.min(
						definition.header.headlineMinFontSize,
						bounds.height
					),
				},
			};
		case "club-crest":
			return {
				...definition,
				header: {
					...definition.header,
					logoX: bounds.x,
					logoY: bounds.y,
					logoWidth: bounds.width,
					logoHeight: bounds.height,
				},
			};
		case "fixture-list": {
			const horizontalOffset = bounds.x - definition.fixtureRow.frameX;
			return {
				...definition,
				fixtureList: {
					...definition.fixtureList,
					top: bounds.y,
					bottom: bounds.y + bounds.height,
				},
				fixtureRow: shiftFixtureRowHorizontally(
					definition.fixtureRow,
					horizontalOffset,
					bounds.x,
					bounds.width
				),
			};
		}
		case "sponsor-section": {
			const top = bounds.y + 34;
			const cardWidth = Math.max(
				1,
				(bounds.width - definition.sponsors.cardGap * 2) / 3
			);
			return {
				...definition,
				sponsors: {
					...definition.sponsors,
					top,
					titleX: bounds.x + bounds.width / 2,
					titleWidth: Math.min(definition.sponsors.titleWidth, bounds.width),
					cardX: bounds.x,
					cardWidth,
					cardHeight: Math.max(
						1,
						bounds.height - definition.sponsors.cardTopOffset - 34
					),
				},
			};
		}
	}

	return definition;
}

export function resetUpcomingTemplateElement(
	definition: UpcomingEditorialTemplateDefinition,
	original: UpcomingEditorialTemplateDefinition,
	elementId: UpcomingTemplateElementId
): UpcomingEditorialTemplateDefinition {
	const childParts = getFixtureChildParts(elementId);
	if (childParts) return resetFixtureRowChild(definition, original, childParts.type);
	if (isFixtureRowId(elementId)) {
		return {
			...definition,
			fixtureList: { ...original.fixtureList },
			fixtureRow: { ...original.fixtureRow },
		};
	}

	switch (elementId) {
		case "section-heading":
			return {
				...definition,
				header: {
					...definition.header,
					sectionTitle: original.header.sectionTitle,
					sectionX: original.header.sectionX,
					sectionY: original.header.sectionY,
					sectionWidth: original.header.sectionWidth,
				},
			};
		case "headline":
			return {
				...definition,
				header: {
					...definition.header,
					headlineX: original.header.headlineX,
					headlineY: original.header.headlineY,
					headlineWidth: original.header.headlineWidth,
					headlineMaxFontSize: original.header.headlineMaxFontSize,
					headlineMinFontSize: original.header.headlineMinFontSize,
				},
			};
		case "club-crest":
			return {
				...definition,
				header: {
					...definition.header,
					logoX: original.header.logoX,
					logoY: original.header.logoY,
					logoWidth: original.header.logoWidth,
					logoHeight: original.header.logoHeight,
				},
			};
		case "fixture-list":
			return {
				...definition,
				fixtureList: { ...original.fixtureList },
				fixtureRow: { ...original.fixtureRow },
			};
		case "sponsor-section":
			return {
				...definition,
				sponsors: { ...original.sponsors },
			};
	}

	return definition;
}

function getTopLevelElements(
	definition: UpcomingEditorialTemplateDefinition,
	includeSponsors: boolean
): UpcomingTemplateElement[] {
	const { header, fixtureList, fixtureRow, sponsors } = definition;
	const elements: UpcomingTemplateElement[] = [
		{
			id: "section-heading",
			label: "Upcoming heading",
			x: header.sectionX - header.sectionWidth / 2,
			y: header.sectionY - 34,
			width: header.sectionWidth,
			height: 58,
			minimumWidth: 180,
			minimumHeight: 58,
		},
		{
			id: "headline",
			label: "Main headline",
			x: header.headlineX,
			y: header.headlineY,
			width: header.headlineWidth,
			height: header.headlineMaxFontSize,
			minimumWidth: 240,
			minimumHeight: 60,
		},
		{
			id: "club-crest",
			label: "Club crest",
			x: header.logoX,
			y: header.logoY,
			width: header.logoWidth,
			height: header.logoHeight,
			minimumWidth: 80,
			minimumHeight: 80,
		},
		{
			id: "fixture-list",
			label: "Fixture rows",
			x: fixtureRow.frameX,
			y: fixtureList.top,
			width: fixtureRow.frameWidth,
			height: fixtureList.bottom - fixtureList.top,
			minimumWidth: 600,
			minimumHeight: 260,
			drillable: true,
		},
	];

	if (includeSponsors) {
		elements.push({
			id: "sponsor-section",
			label: "Sponsor section",
			x: sponsors.cardX,
			y: sponsors.top - 34,
			width: sponsors.cardWidth * 3 + sponsors.cardGap * 2,
			height: sponsors.cardTopOffset + sponsors.cardHeight + 34,
			minimumWidth: 600,
			minimumHeight: 150,
		});
	}

	return elements;
}

function getFixtureRowElement(
	definition: UpcomingEditorialTemplateDefinition,
	fixtureCount: number,
	rowIndex: number
): UpcomingTemplateElement | null {
	const layout = getUpcomingFixtureRowLayouts(definition, fixtureCount)[rowIndex];
	if (!layout) return null;
	return {
		id: `fixture-row:${rowIndex}`,
		label: `Fixture row ${rowIndex + 1} (shared layout)`,
		x: definition.fixtureRow.frameX,
		y: layout.y,
		width: definition.fixtureRow.frameWidth,
		height: layout.height,
		minimumWidth: 600,
		minimumHeight: 60,
		parentId: "fixture-list",
		drillable: true,
		sharedAcrossRows: true,
	};
}

function getFixtureRowChildren(
	definition: UpcomingEditorialTemplateDefinition,
	rowElement: UpcomingTemplateElement,
	rowIndex: number
): UpcomingTemplateElement[] {
	const row = definition.fixtureRow;
	const rowId: UpcomingTemplateElementId = `fixture-row:${rowIndex}`;
	const shared: Pick<
		UpcomingTemplateElement,
		"parentId" | "sharedAcrossRows" | "constraint"
	> = {
		parentId: rowId,
		sharedAcrossRows: true,
		constraint: {
			x: rowElement.x,
			y: rowElement.y,
			width: rowElement.width,
			height: rowElement.height,
		},
	};
	return [
		{
			...shared,
			id: `fixture-calendar:${rowIndex}`,
			label: "Calendar icon (all rows)",
			x: row.calendarX,
			y: rowElement.y + rowElement.height * row.calendarYRatio,
			width: row.calendarSize,
			height: row.calendarSize,
			minimumWidth: 24,
			minimumHeight: 24,
			resizeMode: "square",
		},
		{
			...shared,
			id: `fixture-date:${rowIndex}`,
			label: "Date and competition (all rows)",
			x: row.dateX,
			y: rowElement.y + rowElement.height * row.dateYRatio,
			width: row.dateWidth,
			height: Math.max(
				52,
				rowElement.height * (row.competitionYRatio - row.dateYRatio) + 30
			),
			minimumWidth: 80,
			minimumHeight: 52,
			resizeMode: "horizontal",
		},
		{
			...shared,
			id: `fixture-crest:${rowIndex}`,
			label: "Club crest (all rows)",
			x: row.clubLogoX,
			y: rowElement.y + rowElement.height * row.clubLogoCenterYRatio - row.clubLogoHeight / 2,
			width: row.clubLogoWidth,
			height: row.clubLogoHeight,
			minimumWidth: 30,
			minimumHeight: 30,
		},
		{
			...shared,
			id: `fixture-versus:${rowIndex}`,
			label: "Versus label (all rows)",
			x: row.versusX - 26,
			y: rowElement.y + rowElement.height * row.versusYRatio,
			width: 52,
			height: 40,
			minimumWidth: 52,
			minimumHeight: 40,
			resizeMode: "none",
		},
		{
			...shared,
			id: `fixture-opponent:${rowIndex}`,
			label: "Opponent (all rows)",
			x: row.opponentX,
			y: rowElement.y + rowElement.height * row.opponentYRatio,
			width: row.opponentWidth,
			height: 42,
			minimumWidth: 80,
			minimumHeight: 42,
			resizeMode: "horizontal",
		},
		{
			...shared,
			id: `fixture-location-icon:${rowIndex}`,
			label: "Location icon (all rows)",
			x: row.locationIconX - row.locationIconSize / 2,
			y: rowElement.y + rowElement.height * row.locationIconYRatio,
			width: row.locationIconSize,
			height: row.locationIconSize,
			minimumWidth: 20,
			minimumHeight: 20,
			resizeMode: "square",
		},
		{
			...shared,
			id: `fixture-location:${rowIndex}`,
			label: "Venue and location (all rows)",
			x: row.locationX,
			y: rowElement.y + rowElement.height * row.venueYRatio,
			width: row.locationWidth,
			height: Math.max(
				62,
				rowElement.height * (row.locationYRatio - row.venueYRatio) + 46
			),
			minimumWidth: 80,
			minimumHeight: 62,
			resizeMode: "horizontal",
		},
	];
}

function updateFixtureRowChild(
	definition: UpcomingEditorialTemplateDefinition,
	type: UpcomingFixtureChildType,
	rowIndex: number,
	bounds: TemplateElementBounds,
	fixtureCount: number
) {
	const rowLayout = getUpcomingFixtureRowLayouts(definition, fixtureCount)[rowIndex];
	if (!rowLayout) return definition;
	const row = definition.fixtureRow;
	const yRatio = (bounds.y - rowLayout.y) / rowLayout.height;

	switch (type) {
		case "calendar": {
			const size = Math.max(1, Math.min(bounds.width, bounds.height));
			return withFixtureRow(definition, {
				calendarX: bounds.x,
				calendarYRatio: yRatio,
				calendarSize: size,
			});
		}
		case "date": {
			const currentY = rowLayout.y + rowLayout.height * row.dateYRatio;
			const ratioOffset = (bounds.y - currentY) / rowLayout.height;
			return withFixtureRow(definition, {
				dateX: bounds.x,
				dateYRatio: row.dateYRatio + ratioOffset,
				competitionYRatio: row.competitionYRatio + ratioOffset,
				dateWidth: bounds.width,
			});
		}
		case "crest":
			return withFixtureRow(definition, {
				clubLogoX: bounds.x,
				clubLogoCenterYRatio:
					(bounds.y + bounds.height / 2 - rowLayout.y) / rowLayout.height,
				clubLogoWidth: bounds.width,
				clubLogoHeight: bounds.height,
			});
		case "versus":
			return withFixtureRow(definition, {
				versusX: bounds.x + bounds.width / 2,
				versusYRatio: yRatio,
			});
		case "opponent":
			return withFixtureRow(definition, {
				opponentX: bounds.x,
				opponentYRatio: yRatio,
				opponentWidth: bounds.width,
			});
		case "location-icon": {
			const size = Math.max(1, Math.min(bounds.width, bounds.height));
			return withFixtureRow(definition, {
				locationIconX: bounds.x + bounds.width / 2,
				locationIconYRatio: yRatio,
				locationIconSize: size,
			});
		}
		case "location": {
			const currentY = rowLayout.y + rowLayout.height * row.venueYRatio;
			const ratioOffset = (bounds.y - currentY) / rowLayout.height;
			return withFixtureRow(definition, {
				locationX: bounds.x,
				venueYRatio: row.venueYRatio + ratioOffset,
				locationYRatio: row.locationYRatio + ratioOffset,
				locationWidth: bounds.width,
			});
		}
	}
}

function resetFixtureRowChild(
	definition: UpcomingEditorialTemplateDefinition,
	original: UpcomingEditorialTemplateDefinition,
	type: UpcomingFixtureChildType
) {
	const row = original.fixtureRow;
	switch (type) {
		case "calendar":
			return withFixtureRow(definition, {
				calendarX: row.calendarX,
				calendarYRatio: row.calendarYRatio,
				calendarSize: row.calendarSize,
			});
		case "date":
			return withFixtureRow(definition, {
				dateX: row.dateX,
				dateYRatio: row.dateYRatio,
				competitionYRatio: row.competitionYRatio,
				dateWidth: row.dateWidth,
			});
		case "crest":
			return withFixtureRow(definition, {
				clubLogoX: row.clubLogoX,
				clubLogoCenterYRatio: row.clubLogoCenterYRatio,
				clubLogoWidth: row.clubLogoWidth,
				clubLogoHeight: row.clubLogoHeight,
			});
		case "versus":
			return withFixtureRow(definition, {
				versusX: row.versusX,
				versusYRatio: row.versusYRatio,
			});
		case "opponent":
			return withFixtureRow(definition, {
				opponentX: row.opponentX,
				opponentYRatio: row.opponentYRatio,
				opponentWidth: row.opponentWidth,
			});
		case "location-icon":
			return withFixtureRow(definition, {
				locationIconX: row.locationIconX,
				locationIconYRatio: row.locationIconYRatio,
				locationIconSize: row.locationIconSize,
			});
		case "location":
			return withFixtureRow(definition, {
				locationX: row.locationX,
				venueYRatio: row.venueYRatio,
				locationYRatio: row.locationYRatio,
				locationWidth: row.locationWidth,
			});
	}
}

function shiftFixtureRowHorizontally(
	row: UpcomingEditorialTemplateDefinition["fixtureRow"],
	offset: number,
	frameX: number,
	frameWidth: number
) {
	return {
		...row,
		frameX,
		frameWidth,
		calendarX: row.calendarX + offset,
		dateX: row.dateX + offset,
		firstDividerX: row.firstDividerX + offset,
		clubLogoX: row.clubLogoX + offset,
		versusX: row.versusX + offset,
		opponentX: row.opponentX + offset,
		secondDividerX: row.secondDividerX + offset,
		locationIconX: row.locationIconX + offset,
		locationX: row.locationX + offset,
	};
}

function withFixtureRow(
	definition: UpcomingEditorialTemplateDefinition,
	fixtureRow: Partial<UpcomingEditorialTemplateDefinition["fixtureRow"]>
) {
	return {
		...definition,
		fixtureRow: {
			...definition.fixtureRow,
			...fixtureRow,
		},
	};
}

function isFixtureRowId(elementId: UpcomingTemplateElementId) {
	return /^fixture-row:\d+$/.test(elementId);
}

function getFixtureRowIndex(elementId: UpcomingTemplateElementId | null) {
	if (!elementId) return null;
	const match = elementId.match(/^fixture-(?:row|calendar|date|crest|versus|opponent|location-icon|location):(\d+)$/);
	return match ? Number(match[1]) : null;
}

function getFixtureChildParts(elementId: UpcomingTemplateElementId) {
	const match = elementId.match(/^fixture-(calendar|date|crest|versus|opponent|location-icon|location):(\d+)$/);
	if (!match) return null;
	return {
		type: match[1] as UpcomingFixtureChildType,
		rowIndex: Number(match[2]),
	};
}
