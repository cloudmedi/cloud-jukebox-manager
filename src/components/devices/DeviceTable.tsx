import { Device } from "@/types/device";

interface DeviceTableProps {
  devices: Device[];
}

export const DeviceTable = ({ devices }: DeviceTableProps) => {
  return (
    <div className="space-y-4">
      {devices.map((device) => (
        <div key={device._id} className="p-4 border rounded-lg">
          <h3 className="font-medium">{device.name}</h3>
          <p className="text-sm text-muted-foreground">{device.token}</p>
        </div>
      ))}
    </div>
  );
};

export default DeviceTable;