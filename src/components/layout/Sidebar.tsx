export default function Sidebar() {
  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col">
      <div className="p-6 text-xl font-bold border-b border-blue-800">
        Kingsbridge Colts
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <SidebarItem label="Dashboard" active />
        <SidebarItem label="Matches" />
        <SidebarItem label="Players" />
        <SidebarItem label="Finances" />
        <SidebarItem label="Stats" />
      </nav>
    </aside>
  );
}

function SidebarItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div
      className={`px-4 py-2 rounded-lg cursor-pointer ${
        active ? "bg-yellow-400 text-black" : "hover:bg-blue-800"
      }`}
    >
      {label}
    </div>
  );
}