import {
  Bus,
  Calendar,
  Car,
  History,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Ticket,
  User2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const AdminLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!user) return null;

  const menuItems = [
    {
      path: "/admin",
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard",
      exact: true,
    },
    {
      path: "/admin/reservations",
      icon: <Ticket size={18} />,
      label: "Réservations",
    },
    {
      path: "/admin/schedules",
      icon: <Calendar size={18} />,
      label: "Voyages",
    },

    {
      path: "/admin/schedules/generate",
      icon: <Zap size={18} />,
      label: "Génération auto",
      sub: true,
    },
    {
      path: "/admin/seattemplate",
      icon: <Car size={18} />,
      label: "Disposition chaises",
    },
    { path: "/admin/routes", icon: <MapPin size={18} />, label: "Routes" },
    { path: "/admin/cities", icon: <MapPin size={18} />, label: "Villes" },
    { path: "/admin/users", icon: <Users size={18} />, label: "Utilisateurs" },
    { path: "/admin/drivers", label: "Chauffeurs", icon: <User2 size={18} /> },
    {
      path: "/admin/trips/history",
      label: "Historique voyages",
      icon: <History size={18} />,
    },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 flex items-center justify-between border-b border-white/10 shrink-0">
        <Link
          to="/"
          className="flex items-center gap-2.5"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="size-9 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <Bus size={18} className="text-black" />
          </div>
          <div>
            <span className="text-white font-black text-base leading-none">
              Cotram
            </span>
            <span className="block text-primary/70 text-[10px] font-bold uppercase tracking-wider">
              Admin
            </span>
          </div>
        </Link>
        {/* Close button - mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden size-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {menuItems.map((item) => {
          const active = isActive(item.path, item.exact);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                item.sub ? "ml-4" : ""
              } ${
                active
                  ? item.sub
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-primary text-black font-bold"
                  : item.sub
                    ? "text-primary/50 hover:text-primary hover:bg-primary/10 border border-transparent"
                    : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
              {item.sub && (
                <span className="ml-auto text-[9px] font-black bg-primary/20 text-primary px-1.5 py-0.5 rounded-full shrink-0">
                  NEW
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-white/10 space-y-1 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
          <div className="size-8 rounded-full bg-linear-to-br from-primary to-amber-500 flex items-center justify-center text-black font-black text-sm shrink-0">
            {user.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate leading-none">
              {user.name}
            </p>
            <p className="text-white/40 text-xs truncate mt-0.5">
              {user.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-left text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex w-full">
      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 xl:w-64 bg-dark-gray fixed h-full z-30 flex-col">
        <SidebarContent />
      </aside>

      {/* ── Mobile Overlay ───────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar (drawer) ───────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-dark-gray z-50 transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 lg:ml-60 xl:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200 flex items-center gap-3 px-4 py-3 shadow-sm shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="size-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="size-7 bg-primary rounded-lg flex items-center justify-center">
              <Bus size={13} className="text-black" />
            </div>
            <span className="font-black text-gray-900 text-sm">
              Cotram Admin
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400 hidden sm:block">
              {user.name}
            </span>
            <div className="size-8 rounded-full bg-linear-to-br from-primary to-amber-500 flex items-center justify-center text-black font-black text-xs">
              {user.name[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
