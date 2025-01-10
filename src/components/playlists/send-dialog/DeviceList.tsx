import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Device } from "@/types/device";

interface DeviceListProps {
  searchQuery: string;
  downloadProgress: { [key: string]: number };
  isDownloading: boolean;
}

export function DeviceList({ searchQuery, downloadProgress, isDownloading }: DeviceListProps) {
  const { register, watch } = useFormContext();
  const devices = watch("targetDevices");

  const filteredDevices = devices.filter((device: Device) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <h3 className="text-lg font-semibold">Cihazlar</h3>
      <div className="space-y-2">
        {filteredDevices.map((device) => (
          <div key={device._id} className="flex items-center">
            <Checkbox
              {...register("targetDevices")}
              value={device._id}
              className="mr-2"
            />
            <span>{device.name}</span>
            {isDownloading && downloadProgress[device._id] !== undefined && (
              <Progress 
                value={downloadProgress[device._id]} 
                className="h-1.5 bg-gray-200"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
