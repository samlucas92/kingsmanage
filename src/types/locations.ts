export type OrganizationLocation = {
	id: string;
	name: string;
	address: string;
	notes: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

export type OrganizationLocationInput = Pick<
	OrganizationLocation,
	"name" | "address" | "notes" | "isActive"
>;

export function formatOrganizationLocation(location: OrganizationLocation) {
	return `${location.name}, ${location.address}`;
}
