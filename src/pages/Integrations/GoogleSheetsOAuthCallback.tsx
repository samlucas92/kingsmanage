import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { integrationsApi } from "../../services/integrationsApi";

export default function GoogleSheetsOAuthCallback() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const code = searchParams.get("code");
	const state = searchParams.get("state");
	const providerError = searchParams.get("error_description") || searchParams.get("error");
	const [error, setError] = useState(providerError || (!code || !state ? "Google did not return a valid authorization response." : ""));

	useEffect(() => {
		if (providerError || !code || !state) return;
		integrationsApi.completeGoogleSheetsConnection(code, state)
			.then(() => navigate("/organization/integrations?connected=google-sheets", { replace: true }))
			.catch((connectionError) => setError(connectionError instanceof Error ? connectionError.message : "Google Sheets could not be connected."));
	}, [code, navigate, providerError, state]);

	return <div className="mx-auto max-w-lg py-16 text-center"><div className="surface-card p-8"><h1 className="text-2xl font-black text-slate-950">{error ? "Google Sheets connection failed" : "Finishing Google connection…"}</h1><p className={`mt-3 text-sm ${error ? "text-rose-700" : "text-slate-600"}`}>{error || "Yepset is securely saving access to the spreadsheet you choose."}</p>{error && <Link to="/organization/integrations" className="btn-primary mt-5">Return to integrations</Link>}</div></div>;
}
