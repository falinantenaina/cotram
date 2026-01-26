import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AdminLayout from "./components/admin/AdminLayout";
import MainLayout from "./components/layout/MainLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminReservations from "./pages/admin/Reservations";
import AdminRoutes from "./pages/admin/Routes";
import AdminSchedules from "./pages/admin/Schedules";

import Auth from "./pages/Auth";
import Contact from "./pages/Contact";
import ForgotPassword from "./pages/ForgotPassword";
import GoogleAuthCallback from "./pages/GoogleAuthCallback";
import HomePage from "./pages/HomePage";
import MyReservations from "./pages/MyReservations";
import Profile from "./pages/Profile";
import Reservation from "./pages/Reservation";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import AdminUsers from "./pages/admin/Users";

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
        {
          path: "profile",
          element: <Profile />,
        },
        {
          path: "verify-email",
          element: <VerifyEmail />,
        },
        {
          path: "forgot-password",
          element: <ForgotPassword />,
        },
        {
          path: "reset-password",
          element: <ResetPassword />,
        },
        {
          path: "my-reservations",
          element: <MyReservations />,
        },
        {
          path: "auth/google/callback",
          element: <GoogleAuthCallback />,
        },
        {
          path: "/admin",
          element: <AdminLayout />,
          children: [
            {
              path: "",
              element: <AdminDashboard />,
            },
            {
              path: "reservations",
              element: <AdminReservations />,
            },
            {
              path: "routes",
              element: <AdminRoutes />,
            },
            {
              path: "schedules",
              element: <AdminSchedules />,
            },
            {
              path: "users",
              element: <AdminUsers />,
            },
          ],
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;
