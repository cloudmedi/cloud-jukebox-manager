import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Music2, Headphones, Music4, Music3 } from "lucide-react";

export const DeviceStats = () => {
  const { data: stats } = useQuery({
    queryKey: ['device-stats'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/stats/devices');
      if (!response.ok) {
        throw new Error('Veriler yüklenirken bir hata oluştu');
      }
      return response.json();
    }
  });

  const stats_data = [
    {
      title: "Toplam Cihaz",
      value: stats?.total || 0,
      change: "+2%",
      icon: Music2,
      color: "text-purple-500",
      bgColor: "bg-purple-100"
    },
    {
      title: "Çevrimiçi",
      value: stats?.online || 0,
      change: "+5%",
      icon: Headphones,
      color: "text-emerald-500",
      bgColor: "bg-emerald-100"
    },
    {
      title: "Çevrimdışı",
      value: stats?.offline || 0,
      change: "-3%",
      icon: Music4,
      color: "text-red-500",
      bgColor: "bg-red-100"
    },
    {
      title: "Aktif Playlist",
      value: stats?.withPlaylist || 0,
      change: "+8%",
      icon: Music3,
      color: "text-blue-500",
      bgColor: "bg-blue-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats_data.map((stat, index) => (
        <Card 
          key={index} 
          className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-none bg-gradient-to-br from-white to-gray-50"
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <div className="flex items-baseline space-x-2">
                  <h2 className="text-3xl font-bold tracking-tight">
                    {stat.value}
                  </h2>
                  <span className={`text-sm font-medium ${
                    stat.change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 ${stat.bgColor}`} style={{
              width: stat.change.startsWith('+') ? '70%' : '30%'
            }} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DeviceStats;