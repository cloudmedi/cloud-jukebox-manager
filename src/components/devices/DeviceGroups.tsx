import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Users, List, Table as TableIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DeviceGroupForm } from "./DeviceGroupForm";
import { DeviceGroupsTable } from "./DeviceGroupsTable";

interface DeviceGroup {
  _id: string;
  name: string;
  description: string;
  devices: string[];
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: string;
}

const getGroupIcon = (groupId: string) => {
  const icons = [Laptop2, Headphones, Speaker, Monitor];
  const hash = groupId.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const IconComponent = icons[hash % icons.length];
  return IconComponent;
};

const getGroupColor = (groupId: string) => {
  const colors = [
    "bg-blue-100 border-blue-200",
    "bg-purple-100 border-purple-200",
    "bg-pink-100 border-pink-200",
    "bg-green-100 border-green-200",
    "bg-yellow-100 border-yellow-200",
    "bg-orange-100 border-orange-200"
  ];
  const hash = groupId.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return colors[hash % colors.length];
};

const DeviceGroups = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const { data: groups, isLoading, refetch } = useQuery({
    queryKey: ["device-groups"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      if (!response.ok) {
        throw new Error("Gruplar yüklenirken bir hata oluştu");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Cihaz Grupları</h2>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Users className="mr-2 h-4 w-4" />
              Yeni Grup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DeviceGroupForm onSuccess={() => {
              setIsFormOpen(false);
              refetch();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {viewMode === 'table' ? (
        <DeviceGroupsTable groups={groups} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups?.map((group: DeviceGroup) => {
            const GroupIcon = getGroupIcon(group._id);
            const colorClass = getGroupColor(group._id);
            
            return (
              <div
                key={group._id}
                className={`relative rounded-lg border p-4 transition-all hover:shadow-lg ${colorClass}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-white/50">
                      <GroupIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{group.name}</h3>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    </div>
                  </div>
                  <DeviceGroupActions group={group} onSuccess={refetch} />
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={group.status === 'active' ? "success" : "secondary"}
                      className="capitalize"
                    >
                      {group.status === 'active' ? 'Aktif' : 'Pasif'}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{group.devices.length} Cihaz</span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Oluşturan: {group.createdBy}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tarih: {new Date(group.createdAt).toLocaleDateString("tr-TR")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DeviceGroups;
