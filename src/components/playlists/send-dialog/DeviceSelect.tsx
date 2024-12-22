import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";

interface Device {
  _id: string;
  name: string;
  location?: string;
  isOnline: boolean;
}

export interface DeviceSelectProps {
  devices: Device[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export const DeviceSelect = ({ devices, value, onChange, disabled }: DeviceSelectProps) => {
  const handleCheckboxChange = (deviceId: string, checked: boolean) => {
    if (checked) {
      onChange([...value, deviceId]);
    } else {
      onChange(value.filter(id => id !== deviceId));
    }
  };

  return (
    <div className="space-y-2">
      {devices.map((device) => (
        <div key={device._id} className="flex items-center space-x-2">
          <Checkbox
            id={device._id}
            checked={value.includes(device._id)}
            onCheckedChange={(checked) => handleCheckboxChange(device._id, checked as boolean)}
            disabled={disabled}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor={device._id}
              className={`text-sm font-medium leading-none ${
                device.isOnline ? 'text-green-600' : 'text-gray-500'
              } peer-disabled:cursor-not-allowed peer-disabled:opacity-70`}
            >
              {device.name}
            </label>
            {device.location && (
              <p className="text-xs text-muted-foreground">
                {device.location}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};