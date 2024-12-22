import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DeviceTableHeader } from "./DeviceTableHeader";
import { DeviceTableRow } from "./DeviceTableRow";
import { Table, TableBody } from "@/components/ui/table";
import websocketService from "@/services/websocketService";
import { Device } from "@/services/deviceService";

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
  });

  useEffect(() => {
    websocketService.addMessageHandler('deviceStatus', (data) => {
      queryClient.setQueryData(['devices'], (oldDevices: Device[] | undefined) => {
        if (!oldDevices) return oldDevices;
        
        return oldDevices.map((device) => {
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