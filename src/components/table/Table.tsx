export default function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}