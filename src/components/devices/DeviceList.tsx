import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeviceTableRow } from "./DeviceTableRow";
import { Device } from "@/types/device";
import { memo } from "react";

interface DeviceListProps {
  devices: Device[];
  selectedDevices: string[];
  onDeviceSelect: (deviceToken: string, checked: boolean) => void;
}

const DeviceList = memo(({ devices, selectedDevices, onDeviceSelect }: DeviceListProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Cihaz Adı</TableHead>
            <TableHead>IP Adresi</TableHead>
            <TableHead>Token</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Playlist</TableHead>
            <TableHead>Ses</TableHead>
            <TableHead>Son Görülme</TableHead>
            <TableHead className="w-[150px]">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => (
            <DeviceTableRow
              key={device.token}
              device={device}
              isSelected={selectedDevices.includes(device.token)}
              onSelect={(checked) => onDeviceSelect(device.token, checked)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

DeviceList.displayName = "DeviceList";

export { DeviceList };