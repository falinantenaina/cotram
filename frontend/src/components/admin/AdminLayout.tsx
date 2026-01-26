import {
  Bus,
  Calendar,
  LayoutDashboard,
  LogOut,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
const AdminLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  const menuItems = [
    {
      path: "/admin",
      icon: <LayoutDashboard />,
      label: "Dashboard",
      exact: true,
    },
    { path: "/admin/reservations", icon: <Ticket />, label: "Réservations" },
    { path: "/admin/schedules", icon: <Calendar />, label: "Horaires" },
    { path: "/admin/routes", icon: <MapPin />, label: "Routes" },
    { path: "/admin/users", icon: <Users />, label: "Utilisateurs" },
  ];
  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-gray text-white fixed h-full">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <Bus className="size-8 text-primary" />
            <span className="text-xl font-bold">Cotram Admin</span>
          </Link>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive(item.path, item.exact)
                    ? "bg-primary text-black"
                    : "hover:bg-gray-light"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6">
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-gray-light rounded-lg transition"
          >
            <LogOut />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1">
        <Outlet />
      </main>
    </div>
  );
};
export default AdminLayout;
