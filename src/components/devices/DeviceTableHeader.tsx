import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface DeviceTableHeaderProps {
  onSelectAll: (checked: boolean) => void;
  allSelected: boolean;
  someSelected: boolean;
}

export const DeviceTableHeader = ({
  onSelectAll,
  allSelected,
  someSelected,
}: DeviceTableHeaderProps) => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[40px]">
          <Checkbox 
            checked={allSelected} 
            onCheckedChange={onSelectAll}
            ref={(input) => {
              if (input) {
                input.indeterminate = someSelected && !allSelected;
              }
            }}
          />
        </TableHead>
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