export default function Header() {
  return (
    <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Coach</span>
        <div className="w-8 h-8 bg-blue-900 rounded-full" />
      </div>
    </header>
  );
}