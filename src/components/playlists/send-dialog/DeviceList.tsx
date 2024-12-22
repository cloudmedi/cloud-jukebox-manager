import { FormField } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { DeviceSelect } from "./DeviceSelect";
import { Progress } from "@/components/ui/progress";

interface DeviceListProps {
  searchQuery: string;
  form: any;
  downloadProgress: {[key: string]: number};
  isDownloading: boolean;
}

export const DeviceList = ({ searchQuery, form, downloadProgress, isDownloading }: DeviceListProps) => {
  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/devices');
      if (!response.ok) throw new Error('Cihazlar yüklenemedi');
      return response.json();
    }
  });

  const filteredDevices = devices.filter((device: any) => 
    device.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Cihazlar</h3>
      <ScrollArea className="h-[300px] rounded-md border p-2">
        <FormField
          control={form.control}
          name="targetDevices"
          render={({ field }) => (
            <DeviceSelect
              devices={filteredDevices}
              value={field.value}
              onChange={field.onChange}
              disabled={isDownloading}
            />
          )}
        />
        {isDownloading && (
          <div className="mt-4 space-y-2">
            {filteredDevices.map((device: any) => {
              const progress = downloadProgress[device._id] || 0;
              if (progress > 0) {
                return (
                  <div key={device._id} className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{device.name}</span>
                      <span>%{progress}</span>
                    </div>
                    <Progress value={progress} className="h-1" />
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};