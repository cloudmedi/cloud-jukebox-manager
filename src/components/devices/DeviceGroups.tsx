import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid, LayoutList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DeviceGroupForm } from "./DeviceGroupForm";
import { BulkGroupActions } from "./group-actions/BulkGroupActions";
import { DeviceGroupsTable } from "./table/DeviceGroupsTable";
import { GroupShortcuts } from "./shortcuts/GroupShortcuts";
import { GroupTemplateDialog } from "./group-templates/GroupTemplateDialog";
import { useToast } from "@/components/ui/use-toast";
import { DeviceGroupGrid } from "./grid/DeviceGroupGrid";
import type { DeviceGroup } from "./types";

const DeviceGroups = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: groups = [], isLoading, refetch } = useQuery({
    queryKey: ["device-groups"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      if (!response.ok) {
        throw new Error("Gruplar yüklenirken bir hata oluştu");
      }
      return response.json();
    },
  });

  const filteredGroups = groups.filter((group: DeviceGroup) => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBulkDelete = async (groupIds: string[]) => {
    try {
      await Promise.all(
        groupIds.map(async (groupId) => {
          const response = await fetch(`http://localhost:5000/api/device-groups/${groupId}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error(`Failed to delete group ${groupId}`);
        })
      );
      refetch();
      toast({
        title: "Başarılı",
        description: "Seçili gruplar silindi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Gruplar silinirken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedGroups(filteredGroups.map((group: DeviceGroup) => group._id));
    } else {
      setSelectedGroups([]);
    }
  };

  const handleSelectGroup = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedGroups(prev => [...prev, groupId]);
    } else {
      setSelectedGroups(prev => prev.filter(id => id !== groupId));
    }
  };

  const handleNewGroup = () => setIsFormOpen(true);
  const handleSearch = () => searchInputRef.current?.focus();

  // Klavye kısayolları
  const handleKeyPress = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          handleNewGroup();
          break;
        case 'r':
          e.preventDefault();
          refetch();
          break;
        case 'f':
          e.preventDefault();
          handleSearch();
          break;
        case 'v':
          e.preventDefault();
          setViewMode(prev => prev === "list" ? "grid" : "list");
          break;
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GroupShortcuts
        onNewGroup={handleNewGroup}
        onRefresh={refetch}
        onSearch={handleSearch}
      />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Cihaz Grupları</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-8 w-8"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <GroupTemplateDialog />
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button>Yeni Grup</Button>
            </DialogTrigger>
            <DialogContent>
              <DeviceGroupForm onSuccess={() => {
                setIsFormOpen(false);
                refetch();
              }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Grup adı veya açıklama ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {selectedGroups.length > 0 && (
        <BulkGroupActions
          selectedGroups={selectedGroups}
          onClearSelection={() => setSelectedGroups([])}
          onDeleteGroups={handleBulkDelete}
        />
      )}

      {viewMode === "list" ? (
        <DeviceGroupsTable
          groups={filteredGroups}
          selectedGroups={selectedGroups}
          onSelectAll={handleSelectAll}
          onSelectGroup={handleSelectGroup}
          onRefresh={refetch}
        />
      ) : (
        <DeviceGroupGrid
          groups={filteredGroups}
          selectedGroups={selectedGroups}
          onSelectGroup={handleSelectGroup}
          onRefresh={refetch}
        />
      )}
    </div>
  );
};

export default DeviceGroups;