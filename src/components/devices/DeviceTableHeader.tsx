import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const DeviceTableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Cihaz Adı</TableHead>
        <TableHead>Token</TableHead>
        <TableHead>Konum</TableHead>
        <TableHead>IP Adresi</TableHead>
        <TableHead>Durum</TableHead>
        <TableHead>Playlist Durumu</TableHead>
        <TableHead>Ses Seviyesi</TableHead>
        <TableHead>Son Görülme</TableHead>
        <TableHead className="text-right">İşlemler</TableHead>
      </TableRow>
    </TableHeader>
  );
};