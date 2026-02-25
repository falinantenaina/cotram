import {
  Bus,
  Calendar,
  History,
  LayoutDashboard,
  LogOut,
  MapPin,
  Ticket,
  User2,
  Users,
  Zap,
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
    {
      path: "/admin/schedules/generate",
      icon: <Zap />,
      label: "Génération auto",
      sub: true, // sub-item under Horaires
    },
    { path: "/admin/routes", icon: <MapPin />, label: "Routes" },
    { path: "/admin/users", icon: <Users />, label: "Utilisateurs" },
    { path: "/admin/drivers", label: "Chauffeurs", icon: <User2 /> },
    {
      path: "/admin/trips/history",
      label: "Historique voyages",
      icon: <History />,
    },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-gray text-white fixed h-full flex flex-col">
        <div className="p-6 flex-1 overflow-y-auto">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <Bus className="size-8 text-primary" />
            <span className="text-xl font-bold">Cotram Admin</span>
          </Link>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  item.sub ? "ml-4 text-sm" : ""
                } ${
                  isActive(item.path, item.exact)
                    ? item.path.includes("generate")
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-primary text-black"
                    : item.path.includes("generate")
                      ? "text-primary/60 hover:text-primary hover:bg-primary/10 border border-transparent"
                      : "hover:bg-gray-light"
                }`}
              >
                <span className={item.sub ? "size-4" : ""}>{item.icon}</span>
                <span>{item.label}</span>
                {item.path.includes("generate") && (
                  <span className="ml-auto text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    NEW
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t border-white/10">
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
