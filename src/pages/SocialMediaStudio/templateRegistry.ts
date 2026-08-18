import type { SocialGraphicTemplate } from "./types";
import { blankEditorialTemplate } from "./templates/blankEditorialTemplate";
import { matchdayEditorialTemplate } from "./templates/matchdayEditorialTemplate";
import { lineupEditorialTemplate } from "./templates/lineupEditorialTemplate";
import { resultEditorialTemplate } from "./templates/resultEditorialTemplate";
import { upcomingEditorialTemplate } from "./templates/upcomingEditorialTemplate";

// Visual templates are deliberately source-controlled. Add each template module
// to this registry when it is ready to appear in the Social Media Studio.
export const socialGraphicTemplates: SocialGraphicTemplate[] = [
	blankEditorialTemplate,
	upcomingEditorialTemplate,
	matchdayEditorialTemplate,
	lineupEditorialTemplate,
	resultEditorialTemplate,
];
