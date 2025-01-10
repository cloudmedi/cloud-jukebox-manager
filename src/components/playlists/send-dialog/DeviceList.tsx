import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Device } from "@/types/device";
import { Progress } from "@/components/ui/progress";

interface DeviceListProps {
  searchQuery: string;
  downloadProgress: { [key: string]: number };
  isDownloading: boolean;
}

export const DeviceList = ({ searchQuery, downloadProgress, isDownloading }: DeviceListProps) => {
  const { register, watch } = useFormContext();
  const devices = watch("targetDevices");

  const filteredDevices = devices.filter((device: Device) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    // Logic to handle device selection
  }, [devices]);

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
              {...register("targetDevices")}
              className="ml-2"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeviceList;
