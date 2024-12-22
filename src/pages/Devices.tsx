import DeviceList from "@/components/devices/DeviceList";
import DeviceGroups from "@/components/devices/DeviceGroups";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { SignalHigh, SignalZero, Smartphone } from "lucide-react";

const Devices = () => {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cihaz Yönetimi</h2>
        <p className="text-muted-foreground">
          Cihazları ve cihaz gruplarını yönetin
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Cihaz
            </CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Kayıtlı cihaz sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Çevrimiçi Cihazlar
            </CardTitle>
            <SignalHigh className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats?.online || 0}</div>
            <p className="text-xs text-muted-foreground">
              Aktif bağlantısı olan cihazlar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Çevrimdışı Cihazlar
            </CardTitle>
            <SignalZero className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats?.offline || 0}</div>
            <p className="text-xs text-muted-foreground">
              Bağlantısı olmayan cihazlar
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="devices">
        <TabsList>
          <TabsTrigger value="devices">Cihazlar</TabsTrigger>
          <TabsTrigger value="groups">Gruplar</TabsTrigger>
        </TabsList>
        <TabsContent value="devices">
          <DeviceList />
        </TabsContent>
        <TabsContent value="groups">
          <DeviceGroups />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Devices;