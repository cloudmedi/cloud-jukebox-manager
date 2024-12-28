import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ChartBarBig, TrendingUp, TrendingDown, Music } from "lucide-react";

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
      trend: "up",
      icon: ChartBarBig,
      color: "blue"
    },
    {
      title: "Çevrimiçi",
      value: stats?.online || 0,
      change: "+5%",
      trend: "up",
      icon: TrendingUp,
      color: "green"
    },
    {
      title: "Çevrimdışı",
      value: stats?.offline || 0,
      change: "-3%",
      trend: "down",
      icon: TrendingDown,
      color: "red"
    },
    {
      title: "Aktif Playlist",
      value: stats?.withPlaylist || 0,
      change: "+8%",
      trend: "up",
      icon: Music,
      color: "purple"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats_data.map((stat, index) => (
        <Card 
          key={index} 
          className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
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
                    stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-full bg-${stat.color}-100/50`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 bg-${stat.color}-500`} style={{
              width: stat.trend === 'up' ? '70%' : '30%'
            }} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DeviceStats;