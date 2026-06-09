import { lazy, Suspense, useEffect } from "react";
import { createBrowserRouter, RouterProvider, useLocation } from "react-router-dom";
import { LoadingSpinner } from "./components/common";
import AdminLayout from "./components/admin/AdminLayout";
import MainLayout from "./components/layout/MainLayout";
import { AdminRoute } from "./components/routes/AdminRoute";
import { ProtectedRoute } from "./components/routes/ProtectedRoute";

// Lazy-loaded Admin pages
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminCities = lazy(() => import("./pages/admin/Cities"));
const AdminDrivers = lazy(() => import("./pages/admin/Drivers"));
const AdminReservations = lazy(() => import("./pages/admin/Reservations"));
const AdminRoutes = lazy(() => import("./pages/admin/Routes"));
const AdminSchedules = lazy(() => import("./pages/admin/Schedules"));
const SeatTemplates = lazy(() => import("./pages/admin/SeatTemplates"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const GenerateSchedules = lazy(() => import("./pages/admin/GenerateSchedules"));
const TripHistory = lazy(() => import("./pages/admin/TripHistory"));

// Lazy-loaded Public pages
const Auth = lazy(() => import("./pages/Auth"));
const Contact = lazy(() => import("./pages/Contact"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const GoogleAuthCallback = lazy(() => import("./pages/GoogleAuthCallback"));
const HomePage = lazy(() => import("./pages/HomePage"));
const MyReservations = lazy(() => import("./pages/MyReservations"));
const Profile = lazy(() => import("./pages/Profile"));
const Reservation = lazy(() => import("./pages/Reservation"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

const clientPrefetch = [
  () => import("./pages/Auth"),
  () => import("./pages/Contact"),
  () => import("./pages/ForgotPassword"),
  () => import("./pages/GoogleAuthCallback"),
  () => import("./pages/HomePage"),
  () => import("./pages/MyReservations"),
  () => import("./pages/Profile"),
  () => import("./pages/Reservation"),
  () => import("./pages/ResetPassword"),
  () => import("./pages/VerifyEmail"),
];

const adminPrefetch = [
  () => import("./pages/admin/Dashboard"),
  () => import("./pages/admin/Cities"),
  () => import("./pages/admin/Drivers"),
  () => import("./pages/admin/Reservations"),
  () => import("./pages/admin/Routes"),
  () => import("./pages/admin/Schedules"),
  () => import("./pages/admin/SeatTemplates"),
  () => import("./pages/admin/Users"),
  () => import("./pages/admin/GenerateSchedules"),
  () => import("./pages/admin/TripHistory"),
];

let clientPrefetched = false;
let adminPrefetched = false;

function RoutePrefetcher() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      if (!adminPrefetched) {
        adminPrefetched = true;
        adminPrefetch.forEach((fn) => fn());
      }
    } else {
      if (!clientPrefetched) {
        clientPrefetched = true;
        clientPrefetch.forEach((fn) => fn());
      }
    }
  }, [pathname]);

  return null;
}

const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <RoutePrefetcher />
        <MainLayout />
      </>
    ),
    children: [
      {
        path: "",
        element: (
          <LazyPage>
            <HomePage />
          </LazyPage>
        ),
      },
      {
        path: "auth",
        element: (
          <LazyPage>
            <Auth />
          </LazyPage>
        ),
      },
      {
        path: "reservation",
        element: (
          <LazyPage>
            <ProtectedRoute>
              <Reservation />
            </ProtectedRoute>
          </LazyPage>
        ),
      },
      {
        path: "contact",
        element: (
          <LazyPage>
            <Contact />
          </LazyPage>
        ),
      },
      {
        path: "profile",
        element: (
          <LazyPage>
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </LazyPage>
        ),
      },
      {
        path: "verify-email",
        element: (
          <LazyPage>
            <VerifyEmail />
          </LazyPage>
        ),
      },
      {
        path: "forgot-password",
        element: (
          <LazyPage>
            <ForgotPassword />
          </LazyPage>
        ),
      },
      {
        path: "reset-password",
        element: (
          <LazyPage>
            <ResetPassword />
          </LazyPage>
        ),
      },
      {
        path: "my-reservations",
        element: (
          <LazyPage>
            <ProtectedRoute>
              <MyReservations />
            </ProtectedRoute>
          </LazyPage>
        ),
      },
      {
        path: "auth/google/callback",
        element: (
          <LazyPage>
            <GoogleAuthCallback />
          </LazyPage>
        ),
      },
      {
        path: "/admin",
        element: (
          <LazyPage>
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          </LazyPage>
        ),
        children: [
          {
            path: "",
            element: (
              <LazyPage>
                <Dashboard />
              </LazyPage>
            ),
          },
          {
            path: "reservations",
            element: (
              <LazyPage>
                <AdminReservations />
              </LazyPage>
            ),
          },
          {
            path: "routes",
            element: (
              <LazyPage>
                <AdminRoutes />
              </LazyPage>
            ),
          },
          {
            path: "cities",
            element: (
              <LazyPage>
                <AdminCities />
              </LazyPage>
            ),
          },
          {
            path: "schedules",
            element: (
              <LazyPage>
                <AdminSchedules />
              </LazyPage>
            ),
          },
          {
            path: "schedules/generate",
            element: (
              <LazyPage>
                <GenerateSchedules />
              </LazyPage>
            ),
          },
          {
            path: "seattemplate",
            element: (
              <LazyPage>
                <SeatTemplates />
              </LazyPage>
            ),
          },
          {
            path: "drivers",
            element: (
              <LazyPage>
                <AdminDrivers />
              </LazyPage>
            ),
          },
          {
            path: "trips/history",
            element: (
              <LazyPage>
                <TripHistory />
              </LazyPage>
            ),
          },
          {
            path: "users",
            element: (
              <LazyPage>
                <AdminUsers />
              </LazyPage>
            ),
          },
        ],
      },
    ],
  },
]);

const App = () => <RouterProvider router={router} />;

export default App;
