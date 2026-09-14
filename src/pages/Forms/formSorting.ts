import type { ClubForm, ClubFormStatus } from "../../types/forms";

const statusOrder: Record<ClubFormStatus, number> = {
	Open: 0,
	Draft: 1,
	Closed: 2,
};

export function sortFormsActiveFirst(forms: ClubForm[]) {
	return [...forms].sort(
		(first, second) => statusOrder[first.status] - statusOrder[second.status]
	);
}
