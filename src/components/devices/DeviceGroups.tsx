import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BulkGroupActions } from "./group-actions/BulkGroupActions";
import { DeviceGroupsTable } from "./table/DeviceGroupsTable";
import { useToast } from "@/components/ui/use-toast";
import type { DeviceGroup } from "./types";

const DeviceGroups = () => {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
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
      setSelectedGroups(groups.map((group: DeviceGroup) => group._id));
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Cihaz Grupları</h2>

      {selectedGroups.length > 0 && (
        <BulkGroupActions
          selectedGroups={selectedGroups}
          onClearSelection={() => setSelectedGroups([])}
          onDeleteGroups={handleBulkDelete}
        />
      )}

      <DeviceGroupsTable
        groups={groups}
        selectedGroups={selectedGroups}
        onSelectAll={handleSelectAll}
        onSelectGroup={handleSelectGroup}
        onRefresh={refetch}
      />
    </div>
  );
};

export default DeviceGroups;