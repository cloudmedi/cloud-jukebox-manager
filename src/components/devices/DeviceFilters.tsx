import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Filter, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import DeviceForm from "./DeviceForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

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
  // Benzersiz lokasyonları al
  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    }
  });

  // Benzersiz lokasyonları çıkar
  const uniqueLocations = Array.from(new Set(devices.map((device: any) => device.location))).filter(Boolean);

  // Grupları al
  const { data: groups = [] } = useQuery({
    queryKey: ['device-groups'],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      if (!response.ok) throw new Error("Gruplar yüklenemedi");
      return response.json();
    }
  });

  return (
    <div className="flex items-center justify-between gap-4 w-full mb-4">
      <div className="flex-1 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cihaz adı, token veya IP adresi ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Lokasyon" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tüm Lokasyonlar</SelectItem>
            {uniqueLocations.map((location: string) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Grup" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tüm Gruplar</SelectItem>
            {groups.map((group: any) => (
              <SelectItem key={group._id} value={group._id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="default">
              <Filter className="h-4 w-4 mr-2" />
              Durum
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={filterStatus === "all"}
              onCheckedChange={() => onFilterChange("all")}
            >
              Tümü
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterStatus === "online"}
              onCheckedChange={() => onFilterChange("online")}
            >
              Çevrimiçi
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterStatus === "offline"}
              onCheckedChange={() => onFilterChange("offline")}
            >
              Çevrimdışı
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
  );
};