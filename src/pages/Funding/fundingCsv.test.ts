import { describe, expect, it } from "vitest";

import { parseFundingImportCsv } from "./fundingCsv";

const suppliedCsv = `\uFEFFname,description,amount,application_url,start_date,end_date,status
Cymru Football Foundation – Equipment Fund,"Up to £25,000 for equipment.","Up to £25,000",https://faw.cymru/cff/equipment-fund/,2026-09-01,2026-10-30,Open
Sport Wales – A Place for Sport Crowdfunder,Community projects,"Up to £15,000",https://sport.wales/funding/crowdfunder,,,Rolling
Cymru Football Foundation – Facilities Programme,Major facility projects,"Up to £500,000",https://faw.cymru/cff/facilities-programme/,,,Closed / Track reopening`;

describe("parseFundingImportCsv", () => {
	it("parses the supplied funding format including blank dates and qualified statuses", () => {
		const result = parseFundingImportCsv(suppliedCsv);

		expect(result.fileErrors).toEqual([]);
		expect(result.rows).toHaveLength(3);
		expect(result.rows[0]).toMatchObject({
			name: "Cymru Football Foundation – Equipment Fund",
			amount: "Up to £25,000",
			startDate: "2026-09-01",
			endDate: "2026-10-30",
			status: "Open",
		});
		expect(result.rows[1]).toMatchObject({ startDate: null, endDate: null, status: "Rolling" });
		expect(result.rows[2]).toMatchObject({ status: "Closed", statusDetail: "Closed / Track reopening" });
	});

	it("reports missing headers and invalid rows", () => {
		expect(parseFundingImportCsv("name,status\nExample,Open").fileErrors[0]).toContain("Missing required columns");

		const result = parseFundingImportCsv(`name,description,amount,application_url,start_date,end_date,status
Example,,,not-a-url,2026-10-31,2026-10-01,Unknown`);
		expect(result.rows[0].errors).toEqual(expect.arrayContaining([
			"Application URL must use http or https.",
			"End date cannot be before the start date.",
			"Status must be Open, Upcoming, Rolling, Restricted or Closed.",
		]));
	});

	it("detects duplicates in the file and against existing records", () => {
		const existing = [{
			id: "1",
			name: "Existing fund",
			description: "",
			amount: "",
			applicationUrl: "https://example.org/fund",
			status: "Open" as const,
			statusDetail: "Open",
			applicationState: "Investigating" as const,
			notes: "",
			createdAt: "",
			updatedAt: "",
		}];
		const result = parseFundingImportCsv(`name,description,amount,application_url,start_date,end_date,status
Existing fund,,,https://example.org/fund,,,Open
New fund,,,https://example.org/new,,,Open
New fund,,,https://example.org/new,,,Open`, existing);

		expect(result.rows[0].errors).toContain("This opportunity already exists.");
		expect(result.rows[2].errors).toContain("Duplicates row 3.");
	});
});
