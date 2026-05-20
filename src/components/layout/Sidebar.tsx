import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col">
      <div className="p-6 text-xl font-bold border-b border-blue-800">
        Kingsbridge Colts
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <SidebarItem label="Dashboard" to="/" end />
        <SidebarItem label="Matches" to="/matches" />
        <SidebarItem label="Players" to="/players" />
        <SidebarItem label="Finances" to="/finance" />
        <SidebarItem label="Stats" to="/stats" />
      </nav>
    </aside>
  );
}

function SidebarItem({label,to,end = false,}: {label: string; to: string; end?: boolean;}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `block px-4 py-2 rounded-lg ${
          isActive
            ? "bg-yellow-400 text-black"
            : "text-white hover:bg-blue-800"
        }`
      }
    >
      {label}
    </NavLink>
  );
}