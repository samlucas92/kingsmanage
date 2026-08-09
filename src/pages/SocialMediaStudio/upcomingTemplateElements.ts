import {
	getUpcomingFixtureRowDefinition,
	getUpcomingFixtureRowLayouts,
	isUpcomingFixtureRowUnlocked,
} from "./templates/upcomingEditorialTemplate";
import type {
	UpcomingEditorialFixtureRowDefinition,
	UpcomingEditorialTemplateDefinition,
} from "./templates/upcomingEditorialTemplate";

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
	| "competition"
	| "crest"
	| "versus"
	| "opponent"
	| "location-icon"
	| "venue"
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
	wrapsText?: boolean;
};

export function getUpcomingTemplateElements(
	definition: UpcomingEditorialTemplateDefinition,
	includeSponsors: boolean,
	fixtureCount = 0,
	selectedId: UpcomingTemplateElementId | null = null
): UpcomingTemplateElement[] {
	const topLevelElements = getTopLevelElements(definition, includeSponsors);
	const selectedRowIndex = getUpcomingTemplateRowIndex(selectedId);

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

	const rowIndex = isFixtureRowId(elementId) ? getUpcomingTemplateRowIndex(elementId) : null;
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
			fixtureRowOverrides: shiftFixtureRowOverridesHorizontally(
				definition,
				horizontalOffset
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
				fixtureRowOverrides: shiftFixtureRowOverridesHorizontally(
					definition,
					horizontalOffset
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
	if (childParts) {
		return resetFixtureRowChild(
			definition,
			original,
			childParts.type,
			childParts.rowIndex
		);
	}
	if (isFixtureRowId(elementId)) {
		const rowIndex = getUpcomingTemplateRowIndex(elementId);
		if (rowIndex !== null && isUpcomingFixtureRowUnlocked(definition, rowIndex)) {
			const fixtureRowOverrides = [...definition.fixtureRowOverrides];
			fixtureRowOverrides[rowIndex] = { unlocked: true, values: {} };
			return { ...definition, fixtureRowOverrides };
		}
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
		label: `Fixture row ${rowIndex + 1}`,
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
	const row = getUpcomingFixtureRowDefinition(definition, rowIndex);
	const sharedAcrossRows = !isUpcomingFixtureRowUnlocked(definition, rowIndex);
	const scopeLabel = sharedAcrossRows ? "all rows" : `row ${rowIndex + 1}`;
	const rowId: UpcomingTemplateElementId = `fixture-row:${rowIndex}`;
	const shared: Pick<
		UpcomingTemplateElement,
		"parentId" | "sharedAcrossRows" | "constraint"
	> = {
		parentId: rowId,
		sharedAcrossRows,
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
			label: `Calendar icon (${scopeLabel})`,
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
			label: `Date (${scopeLabel})`,
			x: row.dateX,
			y: rowElement.y + rowElement.height * row.dateYRatio,
			width: row.dateWidth,
			height: 40,
			minimumWidth: 45,
			minimumHeight: 40,
			resizeMode: "horizontal",
			wrapsText: true,
		},
		{
			...shared,
			id: `fixture-competition:${rowIndex}`,
			label: `Competition (${scopeLabel})`,
			x: row.competitionX,
			y: rowElement.y + rowElement.height * row.competitionYRatio,
			width: row.competitionWidth,
			height: 38,
			minimumWidth: 45,
			minimumHeight: 38,
			resizeMode: "horizontal",
			wrapsText: true,
		},
		{
			...shared,
			id: `fixture-crest:${rowIndex}`,
			label: `Club crest (${scopeLabel})`,
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
			label: `Versus label (${scopeLabel})`,
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
			label: `Opponent (${scopeLabel})`,
			x: row.opponentX,
			y: rowElement.y + rowElement.height * row.opponentYRatio,
			width: row.opponentWidth,
			height: 72,
			minimumWidth: 50,
			minimumHeight: 48,
			resizeMode: "horizontal",
			wrapsText: true,
		},
		{
			...shared,
			id: `fixture-location-icon:${rowIndex}`,
			label: `Location icon (${scopeLabel})`,
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
			id: `fixture-venue:${rowIndex}`,
			label: `Home/away (${scopeLabel})`,
			x: row.venueX,
			y: rowElement.y + rowElement.height * row.venueYRatio,
			width: row.venueWidth,
			height: 36,
			minimumWidth: 45,
			minimumHeight: 36,
			resizeMode: "horizontal",
			wrapsText: true,
		},
		{
			...shared,
			id: `fixture-location:${rowIndex}`,
			label: `Location (${scopeLabel})`,
			x: row.locationX,
			y: rowElement.y + rowElement.height * row.locationYRatio,
			width: row.locationWidth,
			height: 58,
			minimumWidth: 45,
			minimumHeight: 42,
			resizeMode: "horizontal",
			wrapsText: true,
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
	const yRatio = (bounds.y - rowLayout.y) / rowLayout.height;

	switch (type) {
		case "calendar": {
			const size = Math.max(1, Math.min(bounds.width, bounds.height));
			return withFixtureRowValues(definition, rowIndex, {
				calendarX: bounds.x,
				calendarYRatio: yRatio,
				calendarSize: size,
			});
		}
		case "date":
			return withFixtureRowValues(definition, rowIndex, {
				dateX: bounds.x,
				dateYRatio: yRatio,
				dateWidth: bounds.width,
			});
		case "competition":
			return withFixtureRowValues(definition, rowIndex, {
				competitionX: bounds.x,
				competitionYRatio: yRatio,
				competitionWidth: bounds.width,
			});
		case "crest":
			return withFixtureRowValues(definition, rowIndex, {
				clubLogoX: bounds.x,
				clubLogoCenterYRatio:
					(bounds.y + bounds.height / 2 - rowLayout.y) / rowLayout.height,
				clubLogoWidth: bounds.width,
				clubLogoHeight: bounds.height,
			});
		case "versus":
			return withFixtureRowValues(definition, rowIndex, {
				versusX: bounds.x + bounds.width / 2,
				versusYRatio: yRatio,
			});
		case "opponent":
			return withFixtureRowValues(definition, rowIndex, {
				opponentX: bounds.x,
				opponentYRatio: yRatio,
				opponentWidth: bounds.width,
			});
		case "location-icon": {
			const size = Math.max(1, Math.min(bounds.width, bounds.height));
			return withFixtureRowValues(definition, rowIndex, {
				locationIconX: bounds.x + bounds.width / 2,
				locationIconYRatio: yRatio,
				locationIconSize: size,
			});
		}
		case "venue":
			return withFixtureRowValues(definition, rowIndex, {
				venueX: bounds.x,
				venueYRatio: yRatio,
				venueWidth: bounds.width,
			});
		case "location":
			return withFixtureRowValues(definition, rowIndex, {
				locationX: bounds.x,
				locationYRatio: yRatio,
				locationWidth: bounds.width,
			});
	}
}

function resetFixtureRowChild(
	definition: UpcomingEditorialTemplateDefinition,
	original: UpcomingEditorialTemplateDefinition,
	type: UpcomingFixtureChildType,
	rowIndex: number
) {
	const row = original.fixtureRow;
	switch (type) {
		case "calendar":
			return resetFixtureRowFields(definition, rowIndex, {
				calendarX: row.calendarX,
				calendarYRatio: row.calendarYRatio,
				calendarSize: row.calendarSize,
			});
		case "date":
			return resetFixtureRowFields(definition, rowIndex, {
				dateX: row.dateX,
				dateYRatio: row.dateYRatio,
				dateWidth: row.dateWidth,
			});
		case "competition":
			return resetFixtureRowFields(definition, rowIndex, {
				competitionX: row.competitionX,
				competitionYRatio: row.competitionYRatio,
				competitionWidth: row.competitionWidth,
			});
		case "crest":
			return resetFixtureRowFields(definition, rowIndex, {
				clubLogoX: row.clubLogoX,
				clubLogoCenterYRatio: row.clubLogoCenterYRatio,
				clubLogoWidth: row.clubLogoWidth,
				clubLogoHeight: row.clubLogoHeight,
			});
		case "versus":
			return resetFixtureRowFields(definition, rowIndex, {
				versusX: row.versusX,
				versusYRatio: row.versusYRatio,
			});
		case "opponent":
			return resetFixtureRowFields(definition, rowIndex, {
				opponentX: row.opponentX,
				opponentYRatio: row.opponentYRatio,
				opponentWidth: row.opponentWidth,
			});
		case "location-icon":
			return resetFixtureRowFields(definition, rowIndex, {
				locationIconX: row.locationIconX,
				locationIconYRatio: row.locationIconYRatio,
				locationIconSize: row.locationIconSize,
			});
		case "venue":
			return resetFixtureRowFields(definition, rowIndex, {
				venueX: row.venueX,
				venueYRatio: row.venueYRatio,
				venueWidth: row.venueWidth,
			});
		case "location":
			return resetFixtureRowFields(definition, rowIndex, {
				locationX: row.locationX,
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
		competitionX: row.competitionX + offset,
		firstDividerX: row.firstDividerX + offset,
		clubLogoX: row.clubLogoX + offset,
		versusX: row.versusX + offset,
		opponentX: row.opponentX + offset,
		secondDividerX: row.secondDividerX + offset,
		locationIconX: row.locationIconX + offset,
		venueX: row.venueX + offset,
		locationX: row.locationX + offset,
	};
}

function withFixtureRowValues(
	definition: UpcomingEditorialTemplateDefinition,
	rowIndex: number,
	values: Partial<UpcomingEditorialFixtureRowDefinition>
) {
	if (isUpcomingFixtureRowUnlocked(definition, rowIndex)) {
		const fixtureRowOverrides = [...definition.fixtureRowOverrides];
		const current = fixtureRowOverrides[rowIndex];
		fixtureRowOverrides[rowIndex] = {
			unlocked: true,
			values: { ...(current?.values ?? {}), ...values },
		};
		return { ...definition, fixtureRowOverrides };
	}
	return {
		...definition,
		fixtureRow: {
			...definition.fixtureRow,
			...values,
		},
	};
}

function resetFixtureRowFields(
	definition: UpcomingEditorialTemplateDefinition,
	rowIndex: number,
	sharedValues: Partial<UpcomingEditorialFixtureRowDefinition>
) {
	if (!isUpcomingFixtureRowUnlocked(definition, rowIndex)) {
		return withFixtureRowValues(definition, rowIndex, sharedValues);
	}
	const fixtureRowOverrides = [...definition.fixtureRowOverrides];
	const current = fixtureRowOverrides[rowIndex];
	const values = { ...(current?.values ?? {}) };
	Object.keys(sharedValues).forEach((key) => {
		delete values[key as keyof UpcomingEditorialFixtureRowDefinition];
	});
	fixtureRowOverrides[rowIndex] = { unlocked: true, values };
	return { ...definition, fixtureRowOverrides };
}

function shiftFixtureRowOverridesHorizontally(
	definition: UpcomingEditorialTemplateDefinition,
	offset: number
) {
	const horizontalFields = [
		"calendarX",
		"dateX",
		"competitionX",
		"firstDividerX",
		"clubLogoX",
		"versusX",
		"opponentX",
		"secondDividerX",
		"locationIconX",
		"venueX",
		"locationX",
	] as const;
	return definition.fixtureRowOverrides.map((override) => {
		if (!override) return override;
		const values = { ...override.values };
		horizontalFields.forEach((field) => {
			const value = values[field];
			if (typeof value === "number") values[field] = value + offset;
		});
		return { ...override, values };
	});
}

function isFixtureRowId(elementId: UpcomingTemplateElementId) {
	return /^fixture-row:\d+$/.test(elementId);
}

export function getUpcomingTemplateRowIndex(elementId: UpcomingTemplateElementId | null) {
	if (!elementId) return null;
	const match = elementId.match(/^fixture-(?:row|calendar|date|competition|crest|versus|opponent|location-icon|venue|location):(\d+)$/);
	return match ? Number(match[1]) : null;
}

function getFixtureChildParts(elementId: UpcomingTemplateElementId) {
	const match = elementId.match(/^fixture-(calendar|date|competition|crest|versus|opponent|location-icon|venue|location):(\d+)$/);
	if (!match) return null;
	return {
		type: match[1] as UpcomingFixtureChildType,
		rowIndex: Number(match[2]),
	};
}
