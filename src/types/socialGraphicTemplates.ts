export type SocialGraphicTemplateCustomization = {
	id: string;
	templateId: string;
	schemaVersion: number;
	definitionJson: string;
	revision: number;
	updatedByUserId: string;
	createdAt: string;
	updatedAt: string;
};

export type SocialGraphicTemplateResponse = {
	templateId: string;
	customization: SocialGraphicTemplateCustomization | null;
};

export type SocialGraphicTemplateRevision = {
	revision: number;
	schemaVersion: number;
	definitionJson: string;
	createdByUserId: string;
	createdAt: string;
};

export type SaveSocialGraphicTemplateRequest = {
	schemaVersion: number;
	definitionJson: string;
	expectedRevision: number;
};

