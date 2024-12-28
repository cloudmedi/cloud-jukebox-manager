import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle2, XCircle, Search } from "lucide-react";
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
import { GroupPreviewCard } from "./group-preview/GroupPreviewCard";
import { BulkGroupActions } from "./group-actions/BulkGroupActions";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface DeviceGroup {
  _id: string;
  name: string;
  description: string;
  devices: string[];
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: string;
}

const DeviceGroups = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
    } catch (error) {
      console.error('Bulk delete error:', error);
      throw error;
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
            <Button>
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
      </div>

      {selectedGroups.length > 0 && (
        <BulkGroupActions
          selectedGroups={selectedGroups}
          onClearSelection={() => setSelectedGroups([])}
          onDeleteGroups={handleBulkDelete}
        />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedGroups.length === filteredGroups.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Grup Adı</TableHead>
              <TableHead>Cihazlar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluşturan</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.map((group: DeviceGroup) => (
              <TableRow key={group._id}>
                <TableCell>
                  <Checkbox
                    checked={selectedGroups.includes(group._id)}
                    onCheckedChange={(checked) => handleSelectGroup(group._id, checked)}
                  />
                </TableCell>
                <TableCell>
                  <GroupPreviewCard group={group}>
                    <div className="cursor-help">
                      <div className="font-medium">{group.name}</div>
                      {group.description && (
                        <div className="text-sm text-muted-foreground">
                          {group.description}
                        </div>
                      )}
                    </div>
                  </GroupPreviewCard>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{group.devices.length}</span>
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
                <TableCell className="text-right">
                  <DeviceGroupActions group={group} onSuccess={refetch} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DeviceGroups;