import { FC } from 'react';
import { Device } from '@/types/device';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DeviceTableProps {
  devices: Device[];
}

export const DeviceTable: FC<DeviceTableProps> = ({ devices }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Location</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devices.map((device) => (
          <TableRow key={device._id}>
            <TableCell>{device.name}</TableCell>
            <TableCell>{device.isOnline ? 'Online' : 'Offline'}</TableCell>
            <TableCell>{device.location}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DeviceTable;