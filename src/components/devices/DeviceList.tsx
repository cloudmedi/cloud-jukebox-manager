import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DeviceTableHeader } from "./DeviceTableHeader";
import { DeviceTableRow } from "./DeviceTableRow";
import { Table, TableBody } from "@/components/ui/table";
import websocketService from "@/services/websocketService";
import { Device } from "@/services/deviceService";
import { toast } from "sonner";

export const DeviceList = () => {
  const queryClient = useQueryClient();
  
  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) {
        throw new Error("Cihazlar yüklenirken bir hata oluştu");
      }
      return response.json();
    },
    // WebSocket güncellemeleri için refetch intervalini kaldırıyoruz
    refetchInterval: 0,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const handleDeviceStatus = (data: any) => {
      // Mevcut cihaz listesini al
      const currentDevices = queryClient.getQueryData<Device[]>(['devices']);
      
      if (!currentDevices) return;

      // Yeni cihaz listesini oluştur
      const updatedDevices = currentDevices.map(device => {
        if (device.token === data.token) {
          // Online/offline durumu değiştiğinde toast göster
          if (device.isOnline !== data.isOnline) {
            toast.info(`${device.name} ${data.isOnline ? 'çevrimiçi' : 'çevrimdışı'} oldu`);
          }
          return { ...device, ...data };
        }
        return device;
      });

      // Query cache'ini güncelle ve yeniden render'ı tetikle
      queryClient.setQueryData(['devices'], updatedDevices);
      
      // Query'yi invalidate et ve yeniden fetch'i tetikle
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    };

    // WebSocket mesaj dinleyicisini ekle
    websocketService.addMessageHandler('deviceStatus', handleDeviceStatus);

    // Component unmount olduğunda dinleyiciyi kaldır
    return () => {
      websocketService.removeMessageHandler('deviceStatus');
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <DeviceTableHeader />
        <TableBody>
          {devices?.map((device: Device) => (
            <DeviceTableRow key={device._id} device={device} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};