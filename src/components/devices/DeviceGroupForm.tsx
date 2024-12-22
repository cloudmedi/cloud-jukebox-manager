import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface DeviceGroupFormProps {
  onSubmit?: (data: { name: string; devices: string[] }) => void;
  onCancel?: () => void;
  onSuccess: () => void;
}

export const DeviceGroupForm = ({ onSubmit, onCancel, onSuccess }: DeviceGroupFormProps) => {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);

  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/devices');
      if (!response.ok) throw new Error('Cihazlar yüklenemedi');
      return response.json();
    }
  });

  const filteredDevices = devices?.filter((device: any) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeviceToggle = (deviceId: string) => {
    setSelectedDevices(prev =>
      prev.includes(deviceId)
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/device-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName,
          devices: selectedDevices
        }),
      });

      if (!response.ok) {
        throw new Error('Grup oluşturulurken bir hata oluştu');
      }

      onSuccess();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="groupName">Grup Adı</Label>
        <Input
          id="groupName"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Grup adını girin"
        />
      </div>

      <div className="space-y-2">
        <Label>Cihazlar</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cihaz ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <ScrollArea className="h-[300px] border rounded-md p-2">
          <div className="space-y-2">
            {filteredDevices?.map((device: any) => (
              <div
                key={device._id}
                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md"
              >
                <Checkbox
                  id={device._id}
                  checked={selectedDevices.includes(device._id)}
                  onCheckedChange={() => handleDeviceToggle(device._id)}
                />
                <Label
                  htmlFor={device._id}
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium">{device.name}</div>
                  <div className="text-sm text-muted-foreground">{device.location}</div>
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" disabled={!groupName || selectedDevices.length === 0}>
          <Check className="mr-2 h-4 w-4" />
          Kaydet
        </Button>
      </div>
    </form>
  );
};