import Sidebar from "./Sidebar";
import Header from "./Header";

type Props = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        
        <main className="p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}