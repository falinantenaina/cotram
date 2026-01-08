import { Outlet } from "react-router-dom";
import { Footer } from "../Footer";
import { Navbar } from "../Navbar";

const MainLayout = () => {
  return (
    <div className="max-w-480 mx-auto">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
