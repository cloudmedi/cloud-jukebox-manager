import { FC } from 'react';
import { Device } from '@/types/device';

interface DeviceTableProps {
  devices: Device[];
}

export const DeviceTable: FC<DeviceTableProps> = ({ devices }) => {
  return (
    <div className="space-y-4">
      {devices.map(device => (
        <div key={device._id} className="p-4 border rounded">
          <h3>{device.name}</h3>
          <p>Status: {device.status}</p>
        </div>
      ))}
    </div>
  );
};

export default DeviceTable;