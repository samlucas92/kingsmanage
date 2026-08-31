import { useContext } from "react";

import { ReportsContext } from "./reportsContextValue";

export function useReportsContext() {
	const context = useContext(ReportsContext);
	if (!context) {
		throw new Error("useReportsContext must be used inside ReportsProvider");
	}
	return context;
}
