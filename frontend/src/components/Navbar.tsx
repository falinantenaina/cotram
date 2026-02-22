import {
  Bus,
  Calendar,
  ChevronDown,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  MenuIcon,
  Settings,
  Ticket,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const menus = [
  { title: "Accueil", to: "/", icon: <Home strokeWidth={1.5} size={18} /> },
  {
    title: "Réserver",
    to: "/reservation",
    icon: <Ticket strokeWidth={1.5} size={18} />,
  },
  {
    title: "Mes trajets",
    to: "/my-reservations",
    icon: <Calendar strokeWidth={1.5} size={18} />,
    authRequired: true,
  },
];

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const visibleMenus = menus.filter((m) => !m.authRequired || user);

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-white/[0.06] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center bg-primary rounded-lg size-9 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
              <Bus size={18} className="text-black" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-white text-lg tracking-tight">
                Cotram
              </span>
              <span className="text-[10px] font-semibold text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Plus
              </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <ul className="hidden md:flex items-center gap-1">
            {visibleMenus.map((menu) => (
              <li key={menu.to}>
                <Link
                  to={menu.to}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(menu.to)
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:text-white/90 hover:bg-white/5"
                  }`}
                >
                  {menu.title}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="size-8 rounded-full ring-2 ring-primary/30"
                    />
                  ) : (
                    <div className="size-8 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-black text-sm font-bold">
                      {user.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col items-start">
                    <span className="text-white text-sm font-semibold leading-none">
                      {user.name.split(" ")[0]}
                    </span>
                    <span className="text-white/40 text-[11px] leading-none mt-0.5">
                      {user.role === "admin" ? "Administrateur" : "Voyageur"}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-white/40 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[#161616] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-white/90 text-sm font-semibold truncate">
                        {user.name}
                      </p>
                      <p className="text-white/40 text-xs truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    <div className="p-1">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-colors"
                      >
                        <Settings size={15} />
                        Mon profil
                      </Link>
                      <Link
                        to="/my-reservations"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-colors"
                      >
                        <Ticket size={15} />
                        Mes réservations
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 w-full px-3 py-2.5 text-primary/80 hover:text-primary hover:bg-primary/10 rounded-lg text-sm transition-colors"
                        >
                          <LayoutDashboard size={15} />
                          Administration
                        </Link>
                      )}
                    </div>
                    <div className="p-1 border-t border-white/10">
                      <button
                        onClick={() => {
                          logout();
                          setDropdownOpen(false);
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg text-sm transition-colors"
                      >
                        <LogOut size={15} />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="text-white/60 hover:text-white text-sm font-medium transition-colors"
                >
                  Connexion
                </Link>
                <button
                  onClick={() => navigate("/reservation")}
                  className="bg-primary text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-95"
                >
                  Réserver un billet
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            {isOpen ? (
              <X size={22} className="text-white" />
            ) : (
              <MenuIcon size={22} className="text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#0a0a0a]">
          <div className="px-4 py-4 space-y-1">
            {visibleMenus.map((menu) => (
              <Link
                key={menu.to}
                to={menu.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(menu.to)
                    ? "bg-primary/10 text-primary"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {menu.icon}
                {menu.title}
              </Link>
            ))}
          </div>

          {user ? (
            <div className="px-4 pb-4 space-y-2 border-t border-white/[0.06] pt-4">
              <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="size-10 rounded-full"
                  />
                ) : (
                  <div className="size-10 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-black font-bold">
                    {user.name[0]}
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold text-sm">
                    {user.name}
                  </p>
                  <p className="text-white/40 text-xs">{user.email}</p>
                </div>
              </div>
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-4 py-3 text-primary/80 hover:bg-primary/10 rounded-xl text-sm transition-colors"
                >
                  <LayoutDashboard size={18} />
                  Administration
                </Link>
              )}
              <button
                onClick={() => logout()}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl text-sm transition-colors"
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="px-4 pb-4 space-y-2 border-t border-white/[0.06] pt-4">
              <Link
                to="/auth"
                className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-sm transition-colors"
              >
                <LogIn size={18} />
                Se connecter
              </Link>
              <button
                onClick={() => navigate("/reservation")}
                className="w-full bg-primary text-black font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-colors"
              >
                Réserver un billet
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
