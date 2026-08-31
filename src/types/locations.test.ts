import { describe, expect, it } from "vitest";

import { formatOrganizationLocation, type OrganizationLocation } from "./locations";

describe("formatOrganizationLocation", () => {
	it("creates a stable venue and address snapshot for a match or event", () => {
		const location: OrganizationLocation = {
			id: "location-id",
			name: "The Hut",
			address: "123 Club Road, Kingsbridge, SA4 6RP",
			notes: "Use the rear car park",
			isActive: true,
			createdAt: "2026-08-31T10:00:00Z",
			updatedAt: "2026-08-31T10:00:00Z",
		};

		expect(formatOrganizationLocation(location)).toBe(
			"The Hut, 123 Club Road, Kingsbridge, SA4 6RP"
		);
	});
});
