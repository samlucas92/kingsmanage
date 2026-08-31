import { useCallback, useEffect, useState } from "react";

import { filesApi } from "../../services/filesApi";

type Props = {
	fileId: string;
	alt: string;
	className?: string;
};

export default function ManagedFileImage({ fileId, alt, className = "" }: Props) {
	const [imageState, setImageState] = useState({
		fileId: "",
		url: "",
		failed: false,
		hasRetried: false,
	});
	const currentImage = imageState.fileId === fileId
		? imageState
		: { fileId, url: "", failed: false, hasRetried: false };

	const loadUrl = useCallback(async (hasRetried: boolean) => {
		const response = await filesApi.getDownloadUrl(fileId);
		setImageState({
			fileId,
			url: response.downloadUrl,
			failed: false,
			hasRetried,
		});
	}, [fileId]);

	useEffect(() => {
		let active = true;

		void filesApi.getDownloadUrl(fileId)
			.then((response) => {
				if (active) {
					setImageState({
						fileId,
						url: response.downloadUrl,
						failed: false,
						hasRetried: false,
					});
				}
			})
			.catch(() => {
				if (active) {
					setImageState({ fileId, url: "", failed: true, hasRetried: false });
				}
			});

		return () => {
			active = false;
		};
	}, [fileId]);

	if (currentImage.failed) {
		return (
			<div className={`grid min-h-24 place-items-center rounded-xl bg-slate-100 px-4 text-sm text-slate-500 ${className}`}>
				Image unavailable
			</div>
		);
	}

	if (!currentImage.url) {
		return <div className={`min-h-24 animate-pulse rounded-xl bg-slate-100 ${className}`} />;
	}

	return (
		<img
			src={currentImage.url}
			alt={alt}
			className={className}
			onError={() => {
				if (currentImage.hasRetried) {
					setImageState({ ...currentImage, failed: true });
					return;
				}
				setImageState({ ...currentImage, hasRetried: true });
				void loadUrl(true).catch(() => {
					setImageState({ ...currentImage, failed: true, hasRetried: true });
				});
			}}
		/>
	);
}
