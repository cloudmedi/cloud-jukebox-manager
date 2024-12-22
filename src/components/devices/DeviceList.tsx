import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deviceService } from "@/services/deviceService";
import { DeviceTableHeader } from "./DeviceTableHeader";
import { DeviceTableRow } from "./DeviceTableRow";
import { Table, TableBody } from "@/components/ui/table";
import websocketService from "@/services/websocketService";

export const DeviceList = () => {
  const queryClient = useQueryClient();
  
  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: deviceService.getDevices,
  });

  useEffect(() => {
    // Cihaz durumu değişikliklerini dinle
    websocketService.addMessageHandler('deviceStatus', (data) => {
      queryClient.setQueryData(['devices'], (oldDevices: any) => {
        if (!oldDevices) return oldDevices;
        
        return oldDevices.map((device: any) => {
          if (device.token === data.token) {
            return { ...device, ...data };
          }
          return device;
        });
      });
    });

    return () => {
      websocketService.removeMessageHandler('deviceStatus');
    };
  }, [queryClient]);

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <DeviceTableHeader />
        <TableBody>
          {devices?.map((device) => (
            <DeviceTableRow key={device._id} device={device} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};