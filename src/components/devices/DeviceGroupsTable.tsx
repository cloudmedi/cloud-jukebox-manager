import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
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

export const DeviceGroupsTable = ({ groups }: { groups: DeviceGroup[] }) => {
  return (
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
          {groups?.map((group) => (
            <TableRow key={group._id}>
              <TableCell className="font-medium">{group.name}</TableCell>
              <TableCell>{group.description}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{group.devices.length}</span>
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
              <TableCell>{new Date(group.createdAt).toLocaleDateString("tr-TR")}</TableCell>
              <TableCell className="text-right">
                <DeviceGroupActions group={group} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};