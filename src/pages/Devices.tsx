import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Device } from '@/types/device';
import { useToast } from "@/hooks/use-toast";
import { DeviceTable } from "@/components/devices/DeviceTable";
import { NewDeviceDialog } from "@/components/devices/NewDeviceDialog";
import { DeviceGroupDialog } from "@/components/devices/DeviceGroupDialog";
import { DeviceGroupList } from "@/components/devices/DeviceGroupList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceStats } from "@/components/devices/DeviceStats";

interface DevicesListProps {
  devices: Device[];
}

function DevicesList({ devices }: DevicesListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {devices.map((device) => (
        <Card key={device._id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {device.name}
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M2 12h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{device.location}</div>
            <p className="text-xs text-muted-foreground">
              {device.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const Devices = () => {
  const [isNewDeviceDialogOpen, setIsNewDeviceDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: devices, isLoading, error, refetch } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) {
        throw new Error("Cihaz verileri alınamadı");
      }
      return response.json();
    },
  });

  const handleDeviceUpdate = () => {
    refetch();
    toast({
      title: "Başarılı",
      description: "Cihaz başarıyla güncellendi",
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Cihaz Yönetimi</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsGroupDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Grup
          </Button>
          <Button onClick={() => setIsNewDeviceDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Cihaz
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="devices">Cihazlar</TabsTrigger>
          <TabsTrigger value="groups">Gruplar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DeviceStats devices={devices || []} />
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Aktif Cihazlar</CardTitle>
                <CardDescription>
                  Şu anda çevrimiçi olan cihazlar
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <DevicesList devices={devices || []} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Cihaz Grupları</CardTitle>
                <CardDescription>
                  Oluşturulan cihaz grupları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DeviceGroupList />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="devices" className="space-y-4">
          <DeviceTable 
            devices={devices || []} 
            onDeviceUpdate={handleDeviceUpdate}
          />
        </TabsContent>
        
        <TabsContent value="groups" className="space-y-4">
          <DeviceGroupList />
        </TabsContent>
      </Tabs>

      <NewDeviceDialog
        open={isNewDeviceDialogOpen}
        onOpenChange={setIsNewDeviceDialogOpen}
        onDeviceCreated={handleDeviceUpdate}
      />

      <DeviceGroupDialog
        open={isGroupDialogOpen}
        onOpenChange={setIsGroupDialogOpen}
      />
    </div>
  );
};

export default Devices;