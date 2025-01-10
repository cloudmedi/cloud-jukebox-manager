import { useFormContext } from "react-hook-form";
import { Progress } from "@/components/ui/progress";
import { Device } from "@/types/device";

interface DeviceListProps {
  searchQuery: string;
  downloadProgress: { [key: string]: number };
  isDownloading: boolean;
  form: any; // Add form prop to interface
}

export const DeviceList = ({ searchQuery, downloadProgress, isDownloading, form }: DeviceListProps) => {
  const devices = form.watch("targetDevices");

  const filteredDevices = devices.filter((device: Device) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-lg font-semibold">Cihazlar</h2>
      <div className="space-y-2">
        {filteredDevices.map((device: Device) => (
          <div key={device._id} className="flex items-center justify-between p-2 border rounded">
            <span>{device.name}</span>
            {isDownloading && downloadProgress[device.token] !== undefined && (
              <Progress 
                value={downloadProgress[device.token]} 
                className="h-1.5 bg-gray-200"
              />
            )}
            <input
              type="checkbox"
              value={device._id}
              {...form.register("targetDevices")}
              className="ml-2"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeviceList;