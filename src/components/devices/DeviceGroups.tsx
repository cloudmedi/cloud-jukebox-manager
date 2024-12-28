import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Users, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DeviceGroupForm } from "./DeviceGroupForm";
import { DeviceGroupActions } from "./DeviceGroupActions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const { toast } = useToast();

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
        <h2 className="text-2xl font-bold tracking-tight">Cihaz Grupları</h2>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grup Adı</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Cihaz Sayısı</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluşturan</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups?.map((group: DeviceGroup) => (
              <TableRow key={group._id} className="group">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{group.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {group.description}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{group.devices.length} Cihaz</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={group.status === 'active' ? "success" : "secondary"}
                    className="capitalize"
                  >
                    {group.status === 'active' ? 'Aktif' : 'Pasif'}
                  </Badge>
                </TableCell>
                <TableCell>{group.createdBy}</TableCell>
                <TableCell>
                  {new Date(group.createdAt).toLocaleDateString("tr-TR")}
                </TableCell>
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