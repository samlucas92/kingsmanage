import { useEffect, useState } from "react";

type ReportResourceState<TReport> = {
	report: TReport | null;
	isLoadingReport: boolean;
	reportError: string;
};

export function useReportResource<TReport>({
	canLoad,
	load,
	errorMessage,
	dependencies,
}: {
	canLoad: boolean;
	load: () => Promise<TReport>;
	errorMessage: string;
	dependencies: readonly unknown[];
}): ReportResourceState<TReport> {
	const [report, setReport] = useState<TReport | null>(null);
	const [isLoadingReport, setIsLoadingReport] = useState(false);
	const [reportError, setReportError] = useState("");

	useEffect(() => {
		let isCurrent = true;
		async function refreshReport() {
			if (!canLoad) {
				setReport(null);
				setIsLoadingReport(false);
				setReportError("");
				return;
			}

			setIsLoadingReport(true);
			setReportError("");
			try {
				const response = await load();
				if (isCurrent) {
					setReport(response);
				}
			} catch (error) {
				if (isCurrent) {
					setReportError(error instanceof Error ? error.message : errorMessage);
					setReport(null);
				}
			} finally {
				if (isCurrent) {
					setIsLoadingReport(false);
				}
			}
		}

		void refreshReport();

		return () => {
			isCurrent = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [canLoad, errorMessage, ...dependencies]);

	return { report, isLoadingReport, reportError };
}
