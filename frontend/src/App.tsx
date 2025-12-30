import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Auth from "./pages/Auth";
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
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;
