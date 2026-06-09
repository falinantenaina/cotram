import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface DriverRouteProps {
  children: React.ReactNode;
}

export const DriverRoute = ({ children }: DriverRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-gray">
        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "driver") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
