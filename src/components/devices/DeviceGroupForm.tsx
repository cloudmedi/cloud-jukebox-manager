import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Device {
  _id: string;
  name: string;
  location?: string;
}

interface DeviceGroup {
  _id: string;
  name: string;
  description: string;
  devices: string[];
  status: 'active' | 'inactive';
  createdBy: string;
}

export interface DeviceGroupFormProps {
  group?: DeviceGroup;
  onSuccess: () => void;
}

export const DeviceGroupForm = ({ group, onSuccess }: DeviceGroupFormProps) => {
  const [name, setName] = useState(group?.name || "");
  const [description, setDescription] = useState(group?.description || "");
  const [selectedDevices, setSelectedDevices] = useState<string[]>(group?.devices || []);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) {
        throw new Error("Cihazlar yüklenemedi");
      }
      return response.json();
    },
  });

  // Seçili cihazların detaylı bilgilerini getir
  const selectedDevicesData = devices.filter((device: Device) => 
    selectedDevices.includes(device._id)
  );

  // Arama kriterine uyan ve seçili olmayan cihazları filtrele
  const filteredDevices = devices.filter((device: Device) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = group
      ? `http://localhost:5000/api/device-groups/${group._id}`
      : "http://localhost:5000/api/device-groups";

    const method = group ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          devices: selectedDevices,
          createdBy: "Admin",
        }),
      });

      if (!response.ok) {
        throw new Error("Grup kaydedilemedi");
      }

      toast.success(group ? "Grup güncellendi" : "Grup oluşturuldu");
      onSuccess();
    } catch (error) {
      toast.error("Bir hata oluştu");
    }
  };

  const removeDevice = (deviceId: string) => {
    setSelectedDevices(prev => prev.filter(id => id !== deviceId));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{group ? "Grubu Düzenle" : "Yeni Grup"}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Grup Adı</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Açıklama</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Seçili cihazları göster */}
        {selectedDevicesData.length > 0 && (
          <div>
            <Label>Seçili Cihazlar</Label>
            <div className="flex flex-wrap gap-2 mt-2 p-2 border rounded-md">
              {selectedDevicesData.map((device: Device) => (
                <Badge 
                  key={device._id} 
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1"
                >
                  {device.name}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeDevice(device._id)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label>Cihazlar</Label>
          <Input
            placeholder="Cihaz ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />
          <ScrollArea className="h-[200px] border rounded-md p-2">
            {filteredDevices.map((device: Device) => (
              <div key={device._id} className="flex items-center space-x-2 py-2">
                <Checkbox
                  id={device._id}
                  checked={selectedDevices.includes(device._id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedDevices([...selectedDevices, device._id]);
                    } else {
                      setSelectedDevices(selectedDevices.filter(id => id !== device._id));
                    }
                  }}
                />
                <Label htmlFor={device._id}>{device.name}</Label>
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">
          {group ? "Güncelle" : "Oluştur"}
        </Button>
      </div>
    </form>
  );
};