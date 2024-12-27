import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useRef, useEffect } from "react";

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
  const checkboxRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      // @ts-ignore - indeterminate exists on HTMLInputElement
      checkboxRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-12">
          <Checkbox
            ref={checkboxRef}
            checked={allSelected}
            onCheckedChange={onSelectAll}
          />
        </TableHead>
        <TableHead>Cihaz Bilgisi</TableHead>
        <TableHead>Token</TableHead>
        <TableHead>Lokasyon</TableHead>
        <TableHead>IP Adresi</TableHead>
        <TableHead>Durum</TableHead>
        <TableHead>Playlist</TableHead>
        <TableHead>Ses Seviyesi</TableHead>
        <TableHead>Son Görülme</TableHead>
        <TableHead className="text-right">İşlemler</TableHead>
      </TableRow>
    </TableHeader>
  );
};