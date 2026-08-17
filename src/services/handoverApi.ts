import { apiClient } from "./apiClient";
import type {
	HandoverAuditEntry,
	HandoverDocumentLink,
	HandoverRecord,
	HandoverStatus,
	HandoverVaultSnapshot,
	OperationalContact,
	OperationalRole,
	OperationalTask,
	OrganizationDocument,
	RoleResponsibility,
} from "../types/handover";

export const handoverApi = {
	getSnapshot: () => apiClient.get<HandoverVaultSnapshot>("/handover"),
	getRole: (id: string) => apiClient.get<OperationalRole>(`/handover/roles/${id}`),
	saveRole: (role: OperationalRole) => apiClient.post<OperationalRole>("/handover/roles", role),
	saveResponsibility: (responsibility: RoleResponsibility) => apiClient.post<RoleResponsibility>("/handover/responsibilities", responsibility),
	linkDocument: (link: HandoverDocumentLink) => apiClient.post<HandoverDocumentLink>("/handover/document-links", link),
	unlinkDocument: (id: string) => apiClient.delete<void>(`/handover/document-links/${id}`),
	saveTask: (task: OperationalTask) => apiClient.post<OperationalTask>("/handover/tasks", task),
	saveContact: (contact: OperationalContact) => apiClient.post<OperationalContact>("/handover/contacts", contact),
	createHandover: (request: {
		operationalRoleId: string;
		outgoingUserId: string | null;
		incomingUserId: string | null;
		dueAt: string | null;
		notes: string;
		accessTransfers: string[];
		additionalItems: string[];
	}) => apiClient.post<HandoverRecord>("/handover/records", request),
	getHandover: (id: string) => apiClient.get<HandoverRecord>(`/handover/records/${id}`),
	confirmItem: (handoverId: string, itemId: string, confirmed: boolean, notes = "") => apiClient.post<HandoverRecord>(`/handover/records/${handoverId}/items/${itemId}/confirm`, { confirmed, notes }),
	setItemStatus: (handoverId: string, itemId: string, status: "Pending" | "NotApplicable" | "Blocked", notes = "") => apiClient.post<HandoverRecord>(`/handover/records/${handoverId}/items/${itemId}/status`, { status, notes }),
	setHandoverStatus: (id: string, status: HandoverStatus) => apiClient.post<HandoverRecord>(`/handover/records/${id}/status`, { status }),
	refreshHandover: (id: string) => apiClient.post<HandoverRecord>(`/handover/records/${id}/refresh`, {}),
	getAudit: (entityId: string) => apiClient.get<HandoverAuditEntry[]>(`/handover/audit/${entityId}`),
	getDocuments: () => apiClient.get<OrganizationDocument[]>("/organization-documents"),
	getDocument: (id: string) => apiClient.get<OrganizationDocument>(`/organization-documents/${id}`),
	createDocument: (title: string, body: string) => apiClient.post<OrganizationDocument>("/organization-documents", { title, body }),
	updateDocument: (id: string, title: string, body: string) => apiClient.put<OrganizationDocument>(`/organization-documents/${id}`, { title, body }),
	setDocumentArchived: (id: string, archived: boolean) => apiClient.patch<OrganizationDocument>(`/organization-documents/${id}/archive`, archived),
};
