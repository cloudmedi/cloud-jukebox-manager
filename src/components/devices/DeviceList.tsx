import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DeviceTableHeader } from "./DeviceTableHeader";
import { DeviceTableRow } from "./DeviceTableRow";
import { Table, TableBody } from "@/components/ui/table";
import { DeviceFilters } from "./DeviceFilters";
import { BulkActionsMenu } from "./bulk-actions/BulkActionsMenu";
import websocketService from "@/services/websocketService";
import { Device } from "@/services/deviceService";
import { 
  showDeviceOfflineNotification, 
  showVolumeWarning, 
  showPlaylistError,
  VOLUME_THRESHOLD 
} from "@/utils/notificationUtils";

export const DeviceList = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<"all" | "online" | "offline">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("_all");
  const [groupFilter, setGroupFilter] = useState("_all");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  
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
    const handleDeviceStatus = (data: any) => {
      const currentDevices = queryClient.getQueryData<Device[]>(['devices']);
      
      if (!currentDevices) return;

      const updatedDevices = currentDevices.map(device => {
        if (device.token === data.token) {
          // Check if device went offline
          if (device.isOnline && !data.isOnline) {
            showDeviceOfflineNotification(device.name);
          }

          // Check volume threshold
          if (data.volume && data.volume >= VOLUME_THRESHOLD) {
            showVolumeWarning(device.name, data.volume);
          }

          // Check playlist loading errors
          if (data.playlistStatus === 'error') {
            showPlaylistError(device.name, 'Playlist yüklenemedi');
          }
          
          return { 
            ...device, 
            ...data,
            playlistStatus: data.playlistStatus || device.playlistStatus
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

  const filteredDevices = devices?.filter((device: Device) => {
    if (filterStatus !== "all" && device.isOnline !== (filterStatus === "online")) {
      return false;
    }

    if (locationFilter !== "_all" && device.location !== locationFilter) {
      return false;
    }

    if (groupFilter !== "_all" && device.groupId !== groupFilter) {
      return false;
    }

    const searchLower = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      device.name.toLowerCase().includes(searchLower) ||
      device.token.toLowerCase().includes(searchLower) ||
      (device.ipAddress && device.ipAddress.toLowerCase().includes(searchLower)) ||
      device.location.toLowerCase().includes(searchLower)
    );
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDevices(filteredDevices.map((device: Device) => device._id));
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
      <DeviceFilters 
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        isFormOpen={isFormOpen}
        setIsFormOpen={setIsFormOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        groupFilter={groupFilter}
        setGroupFilter={setGroupFilter}
      />
      
      {selectedDevices.length > 0 && (
        <BulkActionsMenu 
          selectedDevices={selectedDevices}
          onClearSelection={() => setSelectedDevices([])}
        />
      )}

      <div className="rounded-md border">
        <Table>
          <DeviceTableHeader 
            onSelectAll={handleSelectAll}
            allSelected={selectedDevices.length === filteredDevices?.length}
            someSelected={selectedDevices.length > 0 && selectedDevices.length < filteredDevices?.length}
          />
          <TableBody>
            {filteredDevices?.map((device: Device) => (
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
    </div>
  );
};