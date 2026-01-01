import {
  Building,
  Bus,
  Clock,
  Contact,
  Home,
  LogIn,
  MenuIcon,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type User = {
  name: string;
};

const menus = [
  {
    title: "Accueil",
    to: "/",
    icon: <Home strokeWidth={1} />,
  },
  {
    title: "Horaires",
    to: "/#horaires",
    icon: <Clock strokeWidth={1} />,
  },
  {
    title: "Nos Agences",
    to: "/#agencies",
    icon: <Building strokeWidth={1} />,
  },
  {
    title: "Contact",
    to: "/#contact",
    icon: <Contact strokeWidth={1} />,
  },
];

export const Navbar = () => {
  /* const user = {
    name: "Andry R.",
  } as User; */

  const user = null as User | null;

  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="relative bg-black text-white w-full px-4 py-4 md:px-8 lg:px-16 border-b border-gray-700">
      <div className="flex items-center justify-between text-white/80">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex items-center justify-center bg-primary p-1 size-10 rounded text-black lg:size-12">
            <Bus className="size-6" />
          </div>
          <span className="font-medium lg:text-2xl text-white">Plus</span>
        </Link>
        {/* Menu */}
        <ul className="flex items-center space-x-4 lg:space-x-6 max-md:hidden">
          {menus.map((menu, index) => (
            <li key={index}>
              <Link to={menu.to} className="font-medium hover:text-white">
                {menu.title}
              </Link>
            </li>
          ))}
        </ul>
        {/* Button */}
        {user ? (
          <div className="max-md:hidden">
            <button className="cursor-pointer flex items-center space-x-2 w-full pb-2">
              <div className="flex items-center justify-center bg-primary rounded-full text-black p-2 font-bold w-10">
                {user.name[0]}
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold">{user.name}</span>
                <Link to="/profil" className="text-xs text-gray-500 md:hidden">
                  Editer mon profil
                </Link>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-x-4 max-md:hidden">
            <Link to="/auth" className="font-medium ">
              Se connecter
            </Link>
            <button
              className="bg-primary text-black font-semibold px-6 py-3 rounded cursor-pointer"
              onClick={() => navigate("/reservation")}
            >
              Réserver un billet
            </button>
          </div>
        )}
        {/* Mobile menu button */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
          {!isOpen ? (
            <MenuIcon color="#f2cb04" className="size-8" />
          ) : (
            <X color="#f2cb04" className="size-8" />
          )}
        </button>
        {/* Mobile menu */}
        {isOpen && (
          <div className="absolute left-0 top-[72.8px] bg-black w-full px-4 py-6 space-y-10 md:hidden">
            {user ? (
              <div>
                {/* User Profil button */}
                <button className="cursor-pointer flex items-center space-x-2 w-full pb-2">
                  <div className="flex items-center justify-center bg-primary rounded-full text-black p-2 font-bold w-10">
                    {user.name[0]}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{user.name}</span>
                    <Link to="/profil" className="text-xs text-gray-500">
                      Editer mon profil
                    </Link>
                  </div>
                </button>
              </div>
            ) : (
              <div>
                <Link
                  to="/auth"
                  className="flex items-center space-x-4"
                  onClick={() => setIsOpen(false)}
                >
                  <LogIn color="#f2cb04" />
                  <span>Se connecter</span>
                </Link>
              </div>
            )}
            <ul className="flex flex-col space-y-4">
              {menus.map((menu, index) => (
                <li key={index}>
                  <Link
                    onClick={() => setIsOpen(false)}
                    to={menu.to}
                    className="flex items-center space-x-3"
                  >
                    <div>{menu.icon}</div>
                    <span>{menu.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-col space-y-2">
              <button
                className="bg-primary text-black font-semibold px-6 py-3 rounded"
                onClick={() => (navigate("/reservation"), setIsOpen(false))}
              >
                Réserver un billet
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
