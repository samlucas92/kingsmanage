export type SubscriptionStatus =
	| "Trialing"
	| "Active"
	| "PastDue"
	| "GracePeriod"
	| "Cancelled";

export type OrganizationSubscription = {
	id: string;
	organizationId: string;
	planCode: string;
	status: SubscriptionStatus;
	clubAllowance: number;
	baseMonthlyPrice: number;
	additionalClubMonthlyPrice: number;
	monthlyPrice: number;
	currency: string;
	billingEmail: string;
	trialEndsAt?: string | null;
	currentPeriodEndsAt?: string | null;
	gracePeriodEndsAt?: string | null;
	cancelAtPeriodEnd: boolean;
	provider: string;
	createdAt: string;
	updatedAt: string;
};

export type BillingInvoice = {
	id: string;
	organizationId: string;
	number: string;
	amount: number;
	currency: string;
	status: string;
	issuedAt: string;
	paidAt?: string | null;
};

export type SubscriptionUpdate = {
	clubAllowance: number;
	billingEmail: string;
	cancelAtPeriodEnd: boolean;
};

export type SubscriptionStatusUpdate = {
	status: SubscriptionStatus;
	gracePeriodEndsAt?: string | null;
	currentPeriodEndsAt?: string | null;
};
