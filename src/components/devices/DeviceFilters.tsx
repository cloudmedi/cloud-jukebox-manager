import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import DeviceForm from "./DeviceForm";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { FilterInput } from "./filters/FilterInput";
import { StatusFilter } from "./filters/StatusFilter";
import { LocationFilter } from "./filters/LocationFilter";
import { GroupFilter } from "./filters/GroupFilter";
import { FilterActions } from "./filters/FilterActions";
import { Device } from "@/services/deviceService";
import type { DeviceGroup } from "./types";

interface DeviceFiltersProps {
  filterStatus: "all" | "online" | "offline";
  onFilterChange: (status: "all" | "online" | "offline") => void;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  locationFilter: string;
  setLocationFilter: (location: string) => void;
  groupFilter: string;
  setGroupFilter: (groupId: string) => void;
}

export const DeviceFilters = ({
  filterStatus,
  onFilterChange,
  isFormOpen,
  setIsFormOpen,
  searchQuery,
  setSearchQuery,
  locationFilter,
  setLocationFilter,
  groupFilter,
  setGroupFilter,
}: DeviceFiltersProps) => {
  const isMobile = useIsMobile();

  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    }
  });

  const { data: groups = [] } = useQuery<DeviceGroup[]>({
    queryKey: ['device-groups'],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      if (!response.ok) throw new Error("Gruplar yüklenemedi");
      return response.json();
    }
  });

  const uniqueLocations = Array.from(
    new Set(devices.map((device: Device) => device.location))
  ).filter((location): location is string => Boolean(location));

  const hasActiveFilters = filterStatus !== "all" || locationFilter !== "_all" || groupFilter !== "_all";

  const clearFilters = () => {
    onFilterChange("all");
    setLocationFilter("_all");
    setGroupFilter("_all");
  };

  return (
    <div className="flex flex-col gap-4 w-full mb-4">
      <div className="flex items-center gap-4">
        <FilterInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cihaz adı, token veya IP adresi ara..."
        />

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button size="default">
              <Plus className="h-4 w-4 mr-2" />
              Cihaz Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DeviceForm onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <LocationFilter
          locations={uniqueLocations}
          value={locationFilter}
          onChange={setLocationFilter}
        />

        <GroupFilter
          groups={groups}
          value={groupFilter}
          onChange={setGroupFilter}
        />

        <StatusFilter
          status={filterStatus}
          onChange={onFilterChange}
        />

        <FilterActions
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      </div>
    </div>
  );
};