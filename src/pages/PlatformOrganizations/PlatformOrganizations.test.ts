import { describe, expect, it } from "vitest";

import type { PlatformOrganizationOnboardingRequest } from "../../types/organization";
import {
	generateTemporaryPassword,
	getOnboardingStepError,
} from "./PlatformOrganizations";

const validRequest: PlatformOrganizationOnboardingRequest = {
	organizationName: "Harbour Sports",
	organizationSlug: "harbour-sports",
	clubName: "Harbour FC",
	clubSlug: "harbour-fc",
	sportKey: "football",
	primaryColor: "#0f766e",
	secondaryColor: "#d9f99d",
	clubContactEmail: "club@harbour.test",
	administratorEmail: "admin@harbour.test",
	temporaryPassword: "Temporary123!",
	clubAllowance: 2,
	billingEmail: "billing@harbour.test",
	subscriptionStatus: "Trialing",
};

describe("organization onboarding wizard", () => {
	it("accepts a complete request at every step", () => {
		expect([0, 1, 2, 3].map((step) => getOnboardingStepError(
			step,
			validRequest,
			validRequest.temporaryPassword
		))).toEqual(["", "", "", ""]);
	});

	it("blocks mismatched temporary passwords", () => {
		expect(getOnboardingStepError(2, validRequest, "Different123!"))
			.toBe("The temporary passwords do not match.");
	});

	it("generates passwords that satisfy the minimum length", () => {
		const password = generateTemporaryPassword();
		expect(password.length).toBeGreaterThanOrEqual(8);
		expect(password).toMatch(/[A-Z]/);
		expect(password).toMatch(/[a-z]/);
		expect(password).toMatch(/[^A-Za-z0-9]/);
	});
});
