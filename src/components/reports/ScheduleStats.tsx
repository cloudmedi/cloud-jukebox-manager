import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

const ScheduleStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['schedule-stats'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/stats/schedules');
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
          <CardTitle>Zamanlama İstatistikleri</CardTitle>
          <CardDescription>Yükleniyor...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Aktif Zamanlamalar</CardTitle>
          <CardDescription>Şu anda aktif olan zamanlamalar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Playlist</span>
              <span className="font-bold">8</span>
            </div>
            <div className="flex justify-between">
              <span>Anonslar</span>
              <span className="font-bold">3</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zamanlama Tipleri</CardTitle>
          <CardDescription>Aktif zamanlama dağılımı</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Günlük</span>
              <span className="font-bold">5</span>
            </div>
            <div className="flex justify-between">
              <span>Haftalık</span>
              <span className="font-bold">3</span>
            </div>
            <div className="flex justify-between">
              <span>Özel</span>
              <span className="font-bold">3</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleStats;