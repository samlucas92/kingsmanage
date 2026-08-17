export type OperationalTaskStatus = "NotStarted" | "InProgress" | "Blocked" | "Completed" | "Cancelled";
export type OperationalTaskRecurrence = "None" | "Weekly" | "Monthly" | "Yearly" | "CustomInterval";
export type HandoverStatus = "Draft" | "InProgress" | "ReadyForReview" | "Completed" | "Cancelled";
export type HandoverItemType = "Responsibility" | "OutstandingTask" | "OrganizationDocument" | "Contact" | "AccessTransfer" | "General";
export type HandoverItemStatus = "Pending" | "Confirmed" | "NotApplicable" | "Blocked";
export type ContinuityWarningSeverity = "Critical" | "Attention" | "Complete";

export type OperationalRole = {
	id: string;
	organizationId?: string;
	name: string;
	description: string;
	isActive: boolean;
	displayOrder: number;
	primaryOwnerUserId: string | null;
	supportingOwnerUserIds: string[];
	createdAt?: string;
	createdByUserId?: string;
	updatedAt?: string;
	updatedByUserId?: string;
};

export type RoleResponsibility = {
	id: string;
	organizationId?: string;
	operationalRoleId: string;
	title: string;
	summary: string;
	category: string;
	frequency: string;
	typicalDueDateDescription: string;
	isCritical: boolean;
	isActive: boolean;
};

export type HandoverDocumentLink = {
	id: string;
	organizationId?: string;
	operationalRoleId: string | null;
	responsibilityId: string | null;
	organizationDocumentId: string;
	purpose: string;
	isRequiredForHandover: boolean;
	displayOrder: number;
};

export type OperationalTask = {
	id: string;
	organizationId?: string;
	operationalRoleId: string;
	responsibilityId: string | null;
	title: string;
	description: string;
	dueAt: string | null;
	assignedUserIds: string[];
	status: OperationalTaskStatus;
	completedAt: string | null;
	completedByUserId: string | null;
	completionNotes: string;
	recurrence: OperationalTaskRecurrence;
	recurrenceInterval: number;
	customIntervalDays: number | null;
	nextOccurrenceAt: string | null;
};

export type OperationalContact = {
	id: string;
	organizationId?: string;
	operationalRoleId: string | null;
	responsibilityId: string | null;
	name: string;
	organizationName: string;
	purpose: string;
	email: string;
	phone: string;
	notes: string;
	isActive: boolean;
};

export type HandoverItem = {
	id: string;
	title: string;
	description: string;
	itemType: HandoverItemType;
	sourceEntityId: string | null;
	status: HandoverItemStatus;
	requiresOutgoingConfirmation: boolean;
	requiresIncomingConfirmation: boolean;
	calling?: boolean;
	outgoingConfirmedAt: string | null;
	outgoingConfirmedByUserId: string | null;
	incomingConfirmedAt: string | null;
	incomingConfirmedByUserId: string | null;
	notes: string;
	displayOrder: number;
	documentTitleAtCompletion?: string | null;
	documentPurposeAtCompletion?: string | null;
	acknowledgedAt?: string | null;
};

export type HandoverRecord = {
	id: string;
	organizationId?: string;
	operationalRoleId: string;
	outgoingUserId: string | null;
	incomingUserId: string | null;
	status: HandoverStatus;
	startedAt: string;
	dueAt: string | null;
	readyForReviewAt: string | null;
	completedAt: string | null;
	createdByUserId: string;
	completedByUserId: string | null;
	notes: string;
	items: HandoverItem[];
	createdAt: string;
	updatedAt: string;
};

export type ContinuityWarning = {
	code: string;
	severity: ContinuityWarningSeverity;
	message: string;
	entityType: string;
	entityId: string;
	actionPath: string;
};

export type OrganizationDocument = {
	id: string;
	title: string;
	body: string;
	isArchived: boolean;
	createdByUserId: string;
	createdByUserEmail: string;
	createdAt: string;
	updatedAt: string;
};

export type HandoverVaultSnapshot = {
	roles: OperationalRole[];
	responsibilities: RoleResponsibility[];
	documentLinks: HandoverDocumentLink[];
	tasks: OperationalTask[];
	contacts: OperationalContact[];
	handovers: HandoverRecord[];
	warnings: ContinuityWarning[];
};

export type HandoverAuditEntry = {
	id: string;
	entityType: string;
	entityId: string;
	action: string;
	detail: string;
	userId: string;
	occurredAt: string;
};
