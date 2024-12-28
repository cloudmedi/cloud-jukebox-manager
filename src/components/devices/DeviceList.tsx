import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody } from "@/components/ui/table";
import { DeviceTableHeader } from "./DeviceTableHeader";
import { DeviceTableRow } from "./DeviceTableRow";
import { BulkActionsMenu } from "./bulk-actions/BulkActionsMenu";
import { DeviceCard } from "./DeviceCard";
import websocketService from "@/services/websocketService";
import { Device } from "@/services/deviceService";
import { useIsMobile } from "@/hooks/use-mobile";

export const DeviceList = () => {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const isMobile = useIsMobile();
  
  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) {
        throw new Error("Cihazlar yüklenirken bir hata oluştu");
      }
      return response.json();
    }
  });

  useEffect(() => {
    // Add WebSocket message handlers
    websocketService.addMessageHandler('deviceStatus', () => {
      // The device status handler in DeviceStatusHandler.ts will update the cache
      // No need to do anything here
    });

    return () => {
      websocketService.removeMessageHandler('deviceStatus', () => {});
    };
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDevices(devices.map((device: Device) => device._id));
    } else {
      setSelectedDevices([]);
    }
  };

  const handleSelectDevice = (deviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedDevices(prev => [...prev, deviceId]);
    } else {
      setSelectedDevices(prev => prev.filter(id => id !== deviceId));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedDevices.length > 0 && (
        <BulkActionsMenu 
          selectedDevices={selectedDevices}
          onClearSelection={() => setSelectedDevices([])}
        />
      )}

      {isMobile ? (
        <div className="grid grid-cols-1 gap-4">
          {devices?.map((device: Device) => (
            <DeviceCard
              key={device._id}
              device={device}
              isSelected={selectedDevices.includes(device._id)}
              onSelect={(checked) => handleSelectDevice(device._id, checked)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <DeviceTableHeader 
              onSelectAll={handleSelectAll}
              allSelected={selectedDevices.length === devices?.length}
              someSelected={selectedDevices.length > 0 && selectedDevices.length < devices?.length}
            />
            <TableBody>
              {devices?.map((device: Device) => (
                <DeviceTableRow 
                  key={device._id} 
                  device={device}
                  isSelected={selectedDevices.includes(device._id)}
                  onSelect={(checked) => handleSelectDevice(device._id, checked)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};