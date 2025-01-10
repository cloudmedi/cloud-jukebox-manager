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
    <div className="space-y-1">
      {devices.map((device) => (
        <label
          key={device._id}
          className={`group flex items-center gap-3 p-2 rounded-md transition-all cursor-pointer
            ${value.includes(device._id) ? 'bg-primary/15' : 'hover:bg-gray-100'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="relative flex items-center justify-center">
            <Checkbox
              id={device._id}
              checked={value.includes(device._id)}
              onCheckedChange={(checked) => handleCheckboxChange(device._id, checked as boolean)}
              disabled={disabled}
              className="w-4 h-4 border-gray-300 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            />
            <div className={`absolute w-8 h-8 rounded-full transition-all scale-0 bg-primary/10
              ${value.includes(device._id) ? 'scale-100' : 'group-hover:scale-90'}
            `} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium truncate
                ${value.includes(device._id) ? 'text-gray-900' : 'text-gray-700'}
              `}>
                {device.name}
              </span>
              {device.isOnline && (
                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500" />
              )}
            </div>
            {device.location && (
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {device.location}
              </p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
};