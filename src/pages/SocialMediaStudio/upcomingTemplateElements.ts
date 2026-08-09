import type { UpcomingEditorialTemplateDefinition } from "./templates/upcomingEditorialTemplate";

export type TemplateElementBounds = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type UpcomingTemplateElementId =
	| "section-heading"
	| "headline"
	| "club-crest"
	| "fixture-list"
	| "sponsor-section";

export type UpcomingTemplateElement = TemplateElementBounds & {
	id: UpcomingTemplateElementId;
	label: string;
	minimumWidth: number;
	minimumHeight: number;
};

export function getUpcomingTemplateElements(
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

export function updateUpcomingTemplateElement(
	definition: UpcomingEditorialTemplateDefinition,
	elementId: UpcomingTemplateElementId,
	bounds: TemplateElementBounds
): UpcomingEditorialTemplateDefinition {
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
				fixtureRow: {
					...definition.fixtureRow,
					frameX: bounds.x,
					frameWidth: bounds.width,
					calendarX: definition.fixtureRow.calendarX + horizontalOffset,
					dateX: definition.fixtureRow.dateX + horizontalOffset,
					firstDividerX: definition.fixtureRow.firstDividerX + horizontalOffset,
					clubLogoX: definition.fixtureRow.clubLogoX + horizontalOffset,
					versusX: definition.fixtureRow.versusX + horizontalOffset,
					opponentX: definition.fixtureRow.opponentX + horizontalOffset,
					secondDividerX: definition.fixtureRow.secondDividerX + horizontalOffset,
					locationIconX: definition.fixtureRow.locationIconX + horizontalOffset,
					locationX: definition.fixtureRow.locationX + horizontalOffset,
				},
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
}

export function resetUpcomingTemplateElement(
	definition: UpcomingEditorialTemplateDefinition,
	original: UpcomingEditorialTemplateDefinition,
	elementId: UpcomingTemplateElementId
): UpcomingEditorialTemplateDefinition {
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
}
