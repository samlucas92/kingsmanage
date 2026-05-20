export type CardDetailProps = {
    detail: string;
    main: string;
    title?: string;
};

export default function CardDetailed(props: CardDetailProps) {
  return (
    <div className="bg-blue-900 text-white rounded-2xl p-4">
      {props.title && <h2 className="text-lg font-semibold mb-3">{props.title}</h2>}
        <div className="text-2xl font-bold">
            {props.main}
        </div>
        <p className="text-sm text-muted-foreground">
            {props.detail}
        </p>
    </div>
  );
}