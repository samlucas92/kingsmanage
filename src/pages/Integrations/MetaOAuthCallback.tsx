import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { integrationsApi } from "../../services/integrationsApi";

export default function MetaOAuthCallback() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const code = searchParams.get("code");
	const state = searchParams.get("state");
	const providerError = searchParams.get("error_description");
	const [error, setError] = useState(providerError || (!code || !state ? "Meta did not return a valid authorization response." : ""));

	useEffect(() => {
		if (providerError || !code || !state) return;
		integrationsApi.completeMetaConnection(code, state)
			.then(() => navigate("/organization/integrations?connected=meta&configure=meta", { replace: true }))
			.catch((connectionError) => setError(connectionError instanceof Error ? connectionError.message : "Meta could not be connected."));
	}, [code, navigate, providerError, state]);

	return <div className="mx-auto max-w-lg py-16 text-center"><div className="surface-card p-8"><h1 className="text-2xl font-black text-slate-950">{error ? "Meta connection failed" : "Finishing Meta connection…"}</h1><p className={`mt-3 text-sm ${error ? "text-rose-700" : "text-slate-600"}`}>{error || "Yepset is securely retrieving your available Pages."}</p>{error && <Link to="/organization/integrations" className="btn-primary mt-5">Return to integrations</Link>}</div></div>;
}
