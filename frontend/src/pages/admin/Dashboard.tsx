import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, TrendingUp, Users } from "lucide-react";
import api from "../../lib/axios";

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await api.get("/admin/stats");
      return data;
    },
  });

  const cards = [
    {
      title: "Réservations aujourd'hui",
      value: stats?.todayReservations || 0,
      icon: <Calendar className="size-8" />,
      color: "bg-blue-500",
    },
    {
      title: "Utilisateurs actifs",
      value: stats?.activeUsers || 0,
      icon: <Users className="size-8" />,
      color: "bg-green-500",
    },
    {
      title: "Routes actives",
      value: stats?.activeRoutes || 0,
      icon: <MapPin className="size-8" />,
      color: "bg-purple-500",
    },
    {
      title: "Revenus du mois",
      value: `${(stats?.monthlyRevenue || 0).toLocaleString()} Ar`,
      icon: <TrendingUp className="size-8" />,
      color: "bg-primary",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} text-white p-3 rounded-lg`}>
                {card.icon}
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">{card.title}</h3>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
