import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Auth from "./pages/Auth";
import Contact from "./pages/Contact";
import HomePage from "./pages/HomePage";
import Reservation from "./pages/Reservation";

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <MainLayout />,
      children: [
        {
          path: "",
          element: <HomePage />,
        },
        {
          path: "auth",
          element: <Auth />,
        },
        {
          path: "reservation",
          element: <Reservation />,
        },
        {
          path: "contact",
          element: <Contact />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;
