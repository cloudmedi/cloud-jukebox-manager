import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { X, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Device {
  _id: string;
  name: string;
  location?: string;
}

interface DeviceGroup {
  _id?: string;
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

  // Arama kriterine uyan cihazları filtrele
  const filteredDevices = devices.filter((device: Device) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Grup adı zorunludur");
      return;
    }

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle>{group ? "Grubu Düzenle" : "Yeni Grup"}</DialogTitle>
        <DialogDescription>
          {group ? "Grup bilgilerini ve cihazlarını güncelleyin" : "Yeni bir cihaz grubu oluşturun"}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Grup Adı</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Grup adını girin"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="description">Açıklama</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Grup açıklaması girin"
            className="mt-1.5"
          />
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <Label>Seçili Cihazlar ({selectedDevicesData.length})</Label>
          </div>

          {selectedDevicesData.length > 0 ? (
            <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50">
              {selectedDevicesData.map((device: Device) => (
                <Badge 
                  key={device._id} 
                  variant="secondary"
                  className="flex items-center gap-1.5 px-2 py-1"
                >
                  {device.name}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => removeDevice(device._id)}
                  />
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Henüz cihaz seçilmedi</p>
          )}

          <div className="space-y-2">
            <Label>Cihaz Ekle</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cihaz ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[200px] border rounded-md p-2">
              {filteredDevices.map((device: Device) => (
                <div key={device._id} className="flex items-center space-x-2 py-2 px-1 hover:bg-muted/50 rounded">
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
                  <Label 
                    htmlFor={device._id} 
                    className="flex-1 cursor-pointer text-sm"
                  >
                    <span className="font-medium">{device.name}</span>
                    {device.location && (
                      <span className="text-muted-foreground ml-2">
                        ({device.location})
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" className="min-w-24">
          {group ? "Güncelle" : "Oluştur"}
        </Button>
      </div>
    </form>
  );
};