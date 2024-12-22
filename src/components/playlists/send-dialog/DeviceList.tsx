import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface DeviceListProps {
  searchQuery: string;
  form: any;
}

export const DeviceList = ({ searchQuery, form }: DeviceListProps) => {
  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    },
    initialData: []
  });

  const filteredDevices = devices.filter((device: any) => 
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectAllDevices = () => {
    const allDeviceIds = filteredDevices.map((device: any) => device._id);
    form.setValue("targetDevices", allDeviceIds);
  };

  const toggleDevice = (deviceId: string) => {
    const currentDevices = form.watch("targetDevices") || [];
    const newDevices = currentDevices.includes(deviceId)
      ? currentDevices.filter((id: string) => id !== deviceId)
      : [...currentDevices, deviceId];
    
    form.setValue("targetDevices", newDevices);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Cihazlar</h3>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={selectAllDevices}
        >
          Tümünü Seç
        </Button>
      </div>
      <ScrollArea className="h-[200px] rounded-md border p-2">
        <div className="space-y-2">
          {filteredDevices.map((device: any) => (
            <label
              key={device._id}
              className="flex items-center space-x-2 rounded p-2 hover:bg-muted/50"
            >
              <Checkbox
                checked={form.watch("targetDevices")?.includes(device._id)}
                onCheckedChange={() => toggleDevice(device._id)}
              />
              <span className="text-sm">
                {device.name}
                {device.location && (
                  <span className="text-muted-foreground ml-1">
                    ({device.location})
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};