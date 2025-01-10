import { FormField } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { DeviceSelect } from "./DeviceSelect";
import { Progress } from "@/components/ui/progress";

interface DeviceListProps {
  searchQuery: string;
  form: any;
  downloadProgress: { [key: string]: number };
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">Cihazlar</h3>
          <button
            type="button"
            onClick={() => {
              const currentValue = form.getValues('targetDevices') || [];
              const allDeviceIds = filteredDevices.map(d => d._id);
              if (currentValue.length === allDeviceIds.length) {
                form.setValue('targetDevices', []);
              } else {
                form.setValue('targetDevices', allDeviceIds);
              }
            }}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
            disabled={isDownloading}
          >
            Tümü
          </button>
        </div>
        <span className="text-xs text-gray-500">
          {filteredDevices.length} cihaz
        </span>
      </div>
      
      <ScrollArea className="h-[320px] rounded-lg border border-gray-200 bg-white">
        <div className="p-1.5">
          <FormField
            control={form.control}
            name="targetDevices"
            render={({ field }) => (
              <DeviceSelect
                devices={filteredDevices}
                value={field.value || []}
                onChange={field.onChange}
                disabled={isDownloading}
              />
            )}
          />

          {isDownloading && (
            <div className="mt-4 space-y-2 px-2">
              {filteredDevices.map((device: any) => {
                const progress = downloadProgress[device._id] || 0;
                if (progress > 0) {
                  return (
                    <div key={device._id} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70">{device.name}</span>
                        <span className="text-white/50">%{progress}</span>
                      </div>
                      <Progress
                        value={progress}
                        className="h-1.5 bg-white/10"
                        indicatorClassName="bg-primary"
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};