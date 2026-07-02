import { useCallback, useEffect, useState } from "react";

import { filesApi } from "../../services/filesApi";

type Props = {
	fileId: string;
	alt: string;
	className?: string;
};

export default function ManagedFileImage({ fileId, alt, className = "" }: Props) {
	const [url, setUrl] = useState("");
	const [failed, setFailed] = useState(false);
	const [hasRetried, setHasRetried] = useState(false);

	const loadUrl = useCallback(async () => {
		const response = await filesApi.getDownloadUrl(fileId);
		setUrl(response.downloadUrl);
	}, [fileId]);

	useEffect(() => {
		let active = true;
		setUrl("");
		setFailed(false);
		setHasRetried(false);

		void loadUrl()
			.then(() => {
				if (!active) return;
			})
			.catch(() => {
				if (active) setFailed(true);
			});

		return () => {
			active = false;
		};
	}, [fileId, loadUrl]);

	if (failed) {
		return (
			<div className={`grid min-h-24 place-items-center rounded-xl bg-slate-100 px-4 text-sm text-slate-500 ${className}`}>
				Image unavailable
			</div>
		);
	}

	if (!url) {
		return <div className={`min-h-24 animate-pulse rounded-xl bg-slate-100 ${className}`} />;
	}

	return (
		<img
			src={url}
			alt={alt}
			className={className}
			onError={() => {
				if (hasRetried) {
					setFailed(true);
					return;
				}
				setHasRetried(true);
				void loadUrl().catch(() => setFailed(true));
			}}
		/>
	);
}
