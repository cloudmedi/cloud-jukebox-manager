import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DeviceGroupForm } from "./DeviceGroupForm";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTableRow } from "./group-table/SortableTableRow";
import { BulkActions } from "./group-table/BulkActions";
import { DeviceGroup } from "./types";
import { toast } from "sonner";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

const DeviceGroups = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["device-groups"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      if (!response.ok) {
        throw new Error("Gruplar yüklenirken bir hata oluştu");
      }
      return response.json();
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ groupId, oldIndex, newIndex }: { groupId: string, oldIndex: number, newIndex: number }) => {
      console.log('Sending reorder request:', { groupId, oldIndex, newIndex });
      const response = await fetch("http://localhost:5000/api/device-groups/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupId, oldIndex, newIndex }),
      });
      
      if (!response.ok) {
        throw new Error("Sıralama güncellenirken bir hata oluştu");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-groups"] });
      toast.success("Grup sıralaması güncellendi");
    },
    onError: (error: Error) => {
      console.error('Reorder error:', error);
      toast.error(error.message);
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = groups.findIndex((group: DeviceGroup) => group._id === active.id);
      const newIndex = groups.findIndex((group: DeviceGroup) => group._id === over.id);
      
      console.log('Drag end:', { oldIndex, newIndex, groupId: active.id });
      
      reorderMutation.mutate({
        groupId: active.id,
        oldIndex,
        newIndex,
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

  const filteredGroups = groups.filter((group: DeviceGroup) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <h2 className="text-2xl font-bold tracking-tight">Cihaz Grupları</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>Yeni Grup</Button>
          </DialogTrigger>
          <DialogContent>
            <DeviceGroupForm onSuccess={() => {
              setIsFormOpen(false);
              queryClient.invalidateQueries({ queryKey: ["device-groups"] });
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Grup adı veya açıklama ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {selectedGroups.length > 0 && (
          <BulkActions 
            selectedGroups={selectedGroups} 
            onSuccess={() => {
              setSelectedGroups([]);
              queryClient.invalidateQueries({ queryKey: ["device-groups"] });
            }} 
          />
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedGroups.length === filteredGroups.length && filteredGroups.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Grup Adı</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Cihazlar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluşturan</TableHead>
              <TableHead>Oluşturma Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredGroups.map((group: DeviceGroup) => group._id)}
              strategy={verticalListSortingStrategy}
            >
              <TableBody>
                {filteredGroups.map((group: DeviceGroup) => (
                  <HoverCard key={group._id}>
                    <HoverCardTrigger asChild>
                      <div>
                        <SortableTableRow
                          group={group}
                          selected={selectedGroups.includes(group._id)}
                          onSelect={(checked) => {
                            if (checked) {
                              setSelectedGroups(prev => [...prev, group._id]);
                            } else {
                              setSelectedGroups(prev => prev.filter(id => id !== group._id));
                            }
                          }}
                          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["device-groups"] })}
                        />
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">{group.name}</h4>
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                        <div className="text-sm">
                          <strong>Cihaz Sayısı:</strong> {group.devices.length}
                        </div>
                        <div className="text-sm">
                          <strong>Durum:</strong> {group.status === 'active' ? 'Aktif' : 'Pasif'}
                        </div>
                        <div className="text-sm">
                          <strong>Oluşturan:</strong> {group.createdBy}
                        </div>
                        <div className="text-sm">
                          <strong>Oluşturma Tarihi:</strong>{' '}
                          {new Date(group.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </TableBody>
            </SortableContext>
          </DndContext>
        </Table>
      </div>
    </div>
  );
};

export default DeviceGroups;