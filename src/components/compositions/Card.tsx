type Props = {
  children: React.ReactNode;
  title?: string;
};

export default function Card({ children, title }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
      {children}
    </div>
  );
}