import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <MainLayout />,
      children: [
        {
          path: "",
          element: <div>Accuil</div>,
        },
        {
          path: "reservation",
          element: <div>Reservation</div>,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;
