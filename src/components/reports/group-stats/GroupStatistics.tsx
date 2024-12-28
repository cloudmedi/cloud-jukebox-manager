import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from "lucide-react";

export const GroupStatistics = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['group-stats'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/stats/groups');
      if (!response.ok) throw new Error('İstatistikler yüklenemedi');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const chartData = stats?.groupStats?.map((group: any) => ({
    name: group.name,
    total: group.totalDevices,
    active: group.activeDevices,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Toplam Grup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalGroups || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Aktif Grup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeGroups || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ortalama Cihaz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.groupStats ? Math.round(
                stats.groupStats.reduce((acc: number, curr: any) => acc + curr.totalDevices, 0) / 
                stats.groupStats.length
              ) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grup Bazlı Cihaz Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" name="Toplam Cihaz" fill="#93c5fd" />
                <Bar dataKey="active" name="Aktif Cihaz" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};