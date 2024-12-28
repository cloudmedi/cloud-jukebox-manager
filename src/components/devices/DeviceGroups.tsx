import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle2, XCircle, MoreVertical, Search, Trash2, Power } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DeviceGroupForm } from "./DeviceGroupForm";
import { DeviceGroupActions } from "./DeviceGroupActions";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DeviceGroup {
  _id: string;
  name: string;
  description: string;
  devices: string[];
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: string;
}

const SortableTableRow = ({ group, selected, onSelect }: { 
  group: DeviceGroup; 
  selected: boolean;
  onSelect: (checked: boolean) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: group._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getGroupColor = (groupId: string) => {
    const colors = [
      "hover:bg-blue-50/50", "hover:bg-green-50/50", "hover:bg-purple-50/50",
      "hover:bg-pink-50/50", "hover:bg-yellow-50/50", "hover:bg-orange-50/50"
    ];
    const hash = groupId.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      className={`${getGroupColor(group._id)} cursor-move`}
      {...attributes} 
      {...listeners}
    >
      <TableCell>
        <Checkbox checked={selected} onCheckedChange={onSelect} />
      </TableCell>
      <TableCell className="font-medium">{group.name}</TableCell>
      <TableCell>{group.description}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{group.devices.length}</span>
        </div>
      </TableCell>
      <TableCell>
        {group.status === 'active' ? (
          <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aktif
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-gray-500/15 text-gray-500 hover:bg-gray-500/25">
            <XCircle className="h-3 w-3 mr-1" />
            Pasif
          </Badge>
        )}
      </TableCell>
      <TableCell>{group.createdBy}</TableCell>
      <TableCell>
        {new Date(group.createdAt).toLocaleString("tr-TR")}
      </TableCell>
      <TableCell className="text-right">
        <DeviceGroupActions group={group} onSuccess={refetch} />
      </TableCell>
    </TableRow>
  );
};

const DeviceGroups = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = groups.findIndex((group: DeviceGroup) => group._id === active.id);
      const newIndex = groups.findIndex((group: DeviceGroup) => group._id === over.id);
      
      // Backend'e sıralama güncellemesi gönderilecek endpoint eklendiğinde burası güncellenecek
      console.log(`Moved group from index ${oldIndex} to ${newIndex}`);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedGroups(filteredGroups.map((group: DeviceGroup) => group._id));
    } else {
      setSelectedGroups([]);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`${selectedGroups.length} grubu silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedGroups.map(groupId =>
          fetch(`http://localhost:5000/api/device-groups/${groupId}`, {
            method: 'DELETE'
          })
        )
      );

      toast.success(`${selectedGroups.length} grup başarıyla silindi`);
      setSelectedGroups([]);
      refetch();
    } catch (error) {
      toast.error('Gruplar silinirken bir hata oluştu');
    }
  };

  const handleBulkStatusUpdate = async (status: 'active' | 'inactive') => {
    try {
      await Promise.all(
        selectedGroups.map(groupId =>
          fetch(`http://localhost:5000/api/device-groups/${groupId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
          })
        )
      );

      toast.success(`${selectedGroups.length} grubun durumu güncellendi`);
      setSelectedGroups([]);
      refetch();
    } catch (error) {
      toast.error('Grup durumları güncellenirken bir hata oluştu');
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Cihaz Grupları</h2>
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
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sil ({selectedGroups.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusUpdate('active')}
            >
              <Power className="h-4 w-4 mr-2" />
              Aktif Yap
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusUpdate('inactive')}
            >
              <Power className="h-4 w-4 mr-2" />
              Pasif Yap
            </Button>
          </div>
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
                  <SortableTableRow
                    key={group._id}
                    group={group}
                    selected={selectedGroups.includes(group._id)}
                    onSelect={(checked) => {
                      if (checked) {
                        setSelectedGroups(prev => [...prev, group._id]);
                      } else {
                        setSelectedGroups(prev => prev.filter(id => id !== group._id));
                      }
                    }}
                  />
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