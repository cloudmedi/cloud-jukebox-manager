import { FormField } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Info } from "lucide-react";
import { useFormContext } from "react-hook-form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DeviceListProps {
  devices: any[];
  searchQuery: string;
}

export function DeviceList({ devices, searchQuery }: DeviceListProps) {
  const form = useFormContext();
  const selectedDevices = form.watch("targetDevices") || [];

  const filteredDevices = devices.filter((device) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = () => {
    const allSelected = filteredDevices.every((device) => 
      selectedDevices.includes(device._id)
    );
    
    const newValue = allSelected
      ? selectedDevices.filter((id: string) => 
          !filteredDevices.find((device) => device._id === id)
        )
      : [...new Set([...selectedDevices, ...filteredDevices.map((d) => d._id)])];
    
    form.setValue("targetDevices", newValue);
  };

  const areAllSelected = filteredDevices.length > 0 && 
    filteredDevices.every((device) => selectedDevices.includes(device._id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Cihazlar</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Zamanlamanın uygulanacağı cihazları seçin</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <button
          type="button"
          onClick={handleSelectAll}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          {areAllSelected && <Check className="h-4 w-4" />}
          Tümü
        </button>
      </div>

      <div className="space-y-1">
        {filteredDevices.map((device) => (
          <FormField
            key={device._id}
            name="targetDevices"
            render={({ field }) => (
              <label className="flex items-center p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <Checkbox
                  checked={field.value?.includes(device._id)}
                  onCheckedChange={(checked) => {
                    const newValue = checked
                      ? [...(field.value || []), device._id]
                      : field.value?.filter((id: string) => id !== device._id);
                    field.onChange(newValue);
                  }}
                />
                <div className="ml-3">
                  <p className="text-sm font-medium">{device.name}</p>
                  {device.location && (
                    <p className="text-xs text-muted-foreground">
                      {device.location}
                    </p>
                  )}
                </div>
                {device.isOnline && (
                  <span className="ml-auto flex h-2 w-2 rounded-full bg-green-500" />
                )}
              </label>
            )}
          />
        ))}
      </div>
    </div>
  );
}