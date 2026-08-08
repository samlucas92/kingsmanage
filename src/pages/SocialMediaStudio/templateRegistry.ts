import type { SocialGraphicTemplate } from "./types";
import { matchdayEditorialTemplate } from "./templates/matchdayEditorialTemplate";
import { resultEditorialTemplate } from "./templates/resultEditorialTemplate";
import { upcomingEditorialTemplate } from "./templates/upcomingEditorialTemplate";

// Visual templates are deliberately source-controlled. Add each template module
// to this registry when it is ready to appear in the Social Media Studio.
export const socialGraphicTemplates: SocialGraphicTemplate[] = [
	upcomingEditorialTemplate,
	matchdayEditorialTemplate,
	resultEditorialTemplate,
];
