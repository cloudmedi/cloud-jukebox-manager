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
      gradient: "bg-gradient-to-r from-[#9b87f5] to-[#7E69AB]",
      iconBg: "bg-purple-100"
    },
    {
      title: "Çevrimiçi",
      value: stats?.online || 0,
      change: "+5%",
      icon: Headphones,
      gradient: "bg-gradient-to-r from-[#F2FCE2] to-[#D3E4FD]",
      iconBg: "bg-blue-100"
    },
    {
      title: "Çevrimdışı",
      value: stats?.offline || 0,
      change: "-3%",
      icon: Music4,
      gradient: "bg-gradient-to-r from-[#D946EF] to-[#8B5CF6]",
      iconBg: "bg-pink-100"
    },
    {
      title: "Aktif Playlist",
      value: stats?.withPlaylist || 0,
      change: "+8%",
      icon: Music3,
      gradient: "bg-gradient-to-r from-[#0EA5E9] to-[#6E59A5]",
      iconBg: "bg-indigo-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats_data.map((stat, index) => (
        <Card 
          key={index} 
          className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-none ${stat.gradient}`}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <p className="text-sm font-medium text-white/80">
                  {stat.title}
                </p>
                <div className="flex items-baseline space-x-2">
                  <h2 className="text-3xl font-bold tracking-tight text-white">
                    {stat.value}
                  </h2>
                  <span className={`text-sm font-medium ${
                    stat.change.startsWith('+') ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-full ${stat.iconBg} bg-opacity-20`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-white/20" style={{
              width: stat.change.startsWith('+') ? '70%' : '30%'
            }} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DeviceStats;