import type { PlatformOrganizationOnboardingRequest } from "../../types/organization";

export function getOnboardingStepError(
	step: number,
	values: PlatformOrganizationOnboardingRequest,
	confirmPassword: string
) {
	if (step === 0 && (!values.organizationName.trim() || !values.organizationSlug)) return "Enter an organization name and slug to continue.";
	if (step === 1 && (!values.clubName.trim() || !values.clubSlug || !values.sportKey)) return "Enter the first club details to continue.";
	if (step === 2) {
		if (!/^\S+@\S+\.\S+$/.test(values.administratorEmail)) return "Enter a valid administrator email.";
		if (values.temporaryPassword.length < 8) return "The temporary password must contain at least 8 characters.";
		if (values.temporaryPassword !== confirmPassword) return "The temporary passwords do not match.";
	}
	if (step === 3) {
		if (values.clubAllowance < 1 || values.clubAllowance > 100) return "Club allowance must be between 1 and 100.";
		if (values.billingEmail && !/^\S+@\S+\.\S+$/.test(values.billingEmail)) return "Enter a valid billing email.";
	}
	return "";
}

export function generateTemporaryPassword() {
	return `Yp!${crypto.randomUUID().replaceAll("-", "").slice(0, 13)}`;
}
