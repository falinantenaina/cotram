import { Outlet } from "react-router-dom";
import { Navbar } from "../Navbar";

const MainLayout = () => {
  return (
    <div className="max-w-480 mx-auto">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer>Footer</footer>
    </div>
  );
};

export default MainLayout;
