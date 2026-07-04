export function calculateMonthlyPrice(
	clubAllowance: number,
	baseMonthlyPrice: number,
	additionalClubMonthlyPrice: number
) {
	return (
		baseMonthlyPrice +
		Math.max(0, clubAllowance - 1) * additionalClubMonthlyPrice
	);
}
