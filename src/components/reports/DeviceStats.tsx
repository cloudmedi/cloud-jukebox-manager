import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

const DeviceStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['device-stats'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/stats/devices');
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
          <CardTitle>Cihaz İstatistikleri</CardTitle>
          <CardDescription>Yükleniyor...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Cihaz Durumu</CardTitle>
          <CardDescription>Anlık durum bilgisi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Çevrimiçi</span>
              <span className="font-bold text-green-500">12</span>
            </div>
            <div className="flex justify-between">
              <span>Çevrimdışı</span>
              <span className="font-bold text-red-500">3</span>
            </div>
            <div className="flex justify-between">
              <span>Toplam</span>
              <span className="font-bold">15</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grup Dağılımı</CardTitle>
          <CardDescription>Cihaz grupları</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Mağaza</span>
              <span className="font-bold">5</span>
            </div>
            <div className="flex justify-between">
              <span>Restoran</span>
              <span className="font-bold">7</span>
            </div>
            <div className="flex justify-between">
              <span>Ofis</span>
              <span className="font-bold">3</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceStats;