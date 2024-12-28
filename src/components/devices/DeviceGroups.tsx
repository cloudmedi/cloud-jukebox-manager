import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle2, XCircle, MoreVertical } from "lucide-react";
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

interface DeviceGroup {
  _id: string;
  name: string;
  description: string;
  devices: string[];
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: string;
}

const getGroupColor = (groupId: string) => {
  const colors = [
    "bg-blue-50 hover:bg-blue-100",
    "bg-green-50 hover:bg-green-100",
    "bg-purple-50 hover:bg-purple-100",
    "bg-pink-50 hover:bg-pink-100",
    "bg-yellow-50 hover:bg-yellow-100",
    "bg-orange-50 hover:bg-orange-100"
  ];
  
  const hash = groupId.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return colors[hash % colors.length];
};

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
              <TableHead>Cihazlar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluşturan</TableHead>
              <TableHead>Oluşturma Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups?.map((group: DeviceGroup) => (
              <TableRow 
                key={group._id}
                className={getGroupColor(group._id)}
              >
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DeviceGroups;