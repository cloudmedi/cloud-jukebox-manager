import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

const PerformanceStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['performance-stats'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/stats/performance');
      if (!response.ok) {
        throw new Error('Veriler yüklenirken bir hata oluştu');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performans Metrikleri</CardTitle>
          <CardDescription>Yükleniyor...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Sistem Performansı</CardTitle>
          <CardDescription>Son 24 saat</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Ortalama Yanıt Süresi</span>
              <span className="font-bold">120ms</span>
            </div>
            <div className="flex justify-between">
              <span>Başarılı İstekler</span>
              <span className="font-bold text-green-500">99.9%</span>
            </div>
            <div className="flex justify-between">
              <span>Hata Oranı</span>
              <span className="font-bold text-red-500">0.1%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kaynak Kullanımı</CardTitle>
          <CardDescription>Anlık değerler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>CPU Kullanımı</span>
              <span className="font-bold">45%</span>
            </div>
            <div className="flex justify-between">
              <span>Bellek Kullanımı</span>
              <span className="font-bold">2.1GB</span>
            </div>
            <div className="flex justify-between">
              <span>Disk Kullanımı</span>
              <span className="font-bold">68%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceStats;