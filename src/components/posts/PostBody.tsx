const urlPattern = /(https?:\/\/[^\s]+)/g;

export default function PostBody({ body, inverted = false }: { body: string; inverted?: boolean }) {
	return (
		<>
			{body.split(urlPattern).map((part, index) =>
				part.match(/^https?:\/\//) ? (
					<a
						key={`${part}-${index}`}
						href={part}
						target="_blank"
						rel="noreferrer"
						className={`font-semibold underline underline-offset-2 ${inverted ? "text-white decoration-white/60" : "text-blue-700 decoration-blue-300"}`}
						onClick={(event) => event.stopPropagation()}
					>
						{part}
					</a>
				) : (
					part
				)
			)}
		</>
	);
}
