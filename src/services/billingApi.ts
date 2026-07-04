import { apiClient } from "./apiClient";
import type {
	BillingInvoice,
	OrganizationSubscription,
	SubscriptionStatusUpdate,
	SubscriptionUpdate,
} from "../types/billing";

export const billingApi = {
	getSubscription: () =>
		apiClient.get<OrganizationSubscription>("/billing/subscription"),
	updateSubscription: (update: SubscriptionUpdate) =>
		apiClient.put<OrganizationSubscription>("/billing/subscription", update),
	getInvoices: () => apiClient.get<BillingInvoice[]>("/billing/invoices"),
	getPlatformSubscription: (organizationId: string) =>
		apiClient.get<OrganizationSubscription>(
			`/platform/billing/${organizationId}`
		),
	setPlatformStatus: (
		organizationId: string,
		update: SubscriptionStatusUpdate
	) =>
		apiClient.patch<OrganizationSubscription>(
			`/platform/billing/${organizationId}/status`,
			update
		),
	getPlatformInvoices: (organizationId: string) =>
		apiClient.get<BillingInvoice[]>(
			`/platform/billing/${organizationId}/invoices`
		),
	addPlatformInvoice: (
		organizationId: string,
		invoice: Pick<BillingInvoice, "number" | "amount" | "currency" | "status">
	) =>
		apiClient.post<BillingInvoice>(
			`/platform/billing/${organizationId}/invoices`,
			invoice
		),
};
