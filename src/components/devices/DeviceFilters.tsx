import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import DeviceForm from "./DeviceForm";

interface DeviceFiltersProps {
  filterStatus: "all" | "online" | "offline";
  onFilterChange: (status: "all" | "online" | "offline") => void;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
}

export const DeviceFilters = ({
  filterStatus,
  onFilterChange,
  isFormOpen,
  setIsFormOpen,
}: DeviceFiltersProps) => {
  return (
    <div className="flex items-center justify-between gap-2 w-full mb-4">
      <h2 className="text-3xl font-bold tracking-tight">Cihaz Yönetimi</h2>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="default">
              <Filter className="h-4 w-4" />
              Filtrele
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
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button size="default">
              <Plus className="h-4 w-4" />
              Yeni Cihaz
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DeviceForm onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};