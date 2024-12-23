import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DeviceTableHeader } from "./DeviceTableHeader";
import { DeviceTableRow } from "./DeviceTableRow";
import { Table, TableBody } from "@/components/ui/table";
import { DeviceFilters } from "./DeviceFilters";
import websocketService from "@/services/websocketService";
import { Device } from "@/services/deviceService";
import { toast } from "sonner";

export const DeviceList = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<"all" | "online" | "offline">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("_all");
  const [groupFilter, setGroupFilter] = useState("_all");
  
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
          if (device.isOnline !== data.isOnline) {
            toast.info(`${device.name} ${data.isOnline ? 'çevrimiçi' : 'çevrimdışı'} oldu`);
          }
          
          if (data.playlistStatus && device.playlistStatus !== data.playlistStatus) {
            toast.info(`${device.name} playlist durumu: ${data.playlistStatus}`);
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
      websocketService.removeMessageHandler('deviceStatus');
    };
  }, [queryClient]);

  const filteredDevices = devices?.filter((device: Device) => {
    // Durum filtresi
    if (filterStatus !== "all" && device.isOnline !== (filterStatus === "online")) {
      return false;
    }

    // Lokasyon filtresi
    if (locationFilter !== "_all" && device.location !== locationFilter) {
      return false;
    }

    // Grup filtresi
    if (groupFilter !== "_all" && device.groupId !== groupFilter) {
      return false;
    }

    // Arama filtresi
    const searchLower = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      device.name.toLowerCase().includes(searchLower) ||
      device.token.toLowerCase().includes(searchLower) ||
      (device.ipAddress && device.ipAddress.toLowerCase().includes(searchLower)) ||
      device.location.toLowerCase().includes(searchLower)
    );
  });

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
      <div className="rounded-md border">
        <Table>
          <DeviceTableHeader />
          <TableBody>
            {filteredDevices?.map((device: Device) => (
              <DeviceTableRow key={device._id} device={device} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};