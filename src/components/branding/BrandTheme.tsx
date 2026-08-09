import { useEffect } from "react";

import { useAuthStore } from "../../stores/auth";
import { applyBrandTheme } from "../../utils/brandTheme";

export default function BrandTheme() {
	const activeClub = useAuthStore((state) =>
		state.availableClubs.find((club) => club.isCurrent)
	);

	useEffect(() => {
		applyBrandTheme(document.documentElement.style, activeClub);
	}, [activeClub]);

	return null;
}
