import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody } from "@/components/ui/table";
import { DeviceTableHeader } from "./DeviceTableHeader";
import { DeviceTableRow } from "./DeviceTableRow";
import { BulkActionsMenu } from "./bulk-actions/BulkActionsMenu";
import { DeviceCard } from "./DeviceCard";
import websocketService from "@/services/websocketService";
import type { Device } from "@/types/device";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  showDeviceOfflineNotification, 
  showVolumeWarning, 
  showPlaylistError,
  VOLUME_THRESHOLD 
} from "@/utils/notificationUtils";

export const DeviceList = () => {
  const queryClient = useQueryClient();
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
    },
    refetchInterval: 5000 // Polling every 5 seconds as backup
  });

  useEffect(() => {
    const handleDeviceStatus = (data: any) => {
      console.log('WebSocket device status received:', data);
      
      const currentDevices = queryClient.getQueryData<Device[]>(['devices']);
      if (!currentDevices) return;

      const updatedDevices = currentDevices.map(device => {
        if (device.token === data.token) {
          if (device.isOnline && !data.isOnline) {
            showDeviceOfflineNotification(device.name);
          }

          if (data.volume && data.volume >= VOLUME_THRESHOLD) {
            showVolumeWarning(device.name, data.volume);
          }

          if (data.playlistStatus === 'error') {
            showPlaylistError(device.name, data.lastError || 'Playlist yüklenemedi');
          }
          
          // Log state change
          if (data.isPlaying !== undefined) {
            console.log('Device playback state update:', {
              deviceName: device.name,
              oldState: device.isPlaying,
              newState: data.isPlaying
            });
          }
          
          return { 
            ...device, 
            ...data,
            isPlaying: data.isPlaying !== undefined ? data.isPlaying : device.isPlaying,
            playlistStatus: data.playlistStatus || device.playlistStatus,
            downloadProgress: data.downloadProgress || device.downloadProgress,
            downloadSpeed: data.downloadSpeed || device.downloadSpeed,
            downloadedSongs: data.downloadedSongs || device.downloadedSongs,
            totalSongs: data.totalSongs || device.totalSongs,
            estimatedTimeRemaining: data.estimatedTimeRemaining || device.estimatedTimeRemaining,
            retryCount: data.retryCount || device.retryCount,
            lastError: data.error || device.lastError
          };
        }
        return device;
      });

      queryClient.setQueryData(['devices'], updatedDevices);
    };

    websocketService.addMessageHandler('deviceStatus', handleDeviceStatus);

    return () => {
      websocketService.removeMessageHandler('deviceStatus', handleDeviceStatus);
    };
  }, [queryClient]);

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