import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface SendPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: {
    _id: string;
    name: string;
  };
}

export const SendPlaylistDialog = ({ isOpen, onClose, playlist }: SendPlaylistDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const form = useForm({
    defaultValues: {
      targetDevices: [],
      targetGroups: []
    }
  });

  // Cihazları çek
  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    }
  });

  // Grupları çek
  const { data: groups = [] } = useQuery({
    queryKey: ['device-groups'],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      if (!response.ok) throw new Error("Gruplar yüklenemedi");
      return response.json();
    }
  });

  // Arama filtreleri
  const filteredDevices = devices.filter((device: any) => 
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((group: any) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Tümünü seç fonksiyonları
  const selectAllDevices = () => {
    const allDeviceIds = filteredDevices.map((device: any) => device._id);
    setSelectedDevices(allDeviceIds);
    form.setValue("targetDevices", allDeviceIds);
  };

  const selectAllGroups = () => {
    const allGroupIds = filteredGroups.map((group: any) => group._id);
    setSelectedGroups(allGroupIds);
    form.setValue("targetGroups", allGroupIds);
  };

  // Tekil seçim fonksiyonları
  const toggleDevice = (deviceId: string) => {
    setSelectedDevices(prev => {
      const newSelection = prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId];
      
      form.setValue("targetDevices", newSelection);
      return newSelection;
    });
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => {
      const newSelection = prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId];
      
      form.setValue("targetGroups", newSelection);
      return newSelection;
    });
  };

  const onSubmit = async (data: any) => {
    try {
      if (!selectedDevices.length && !selectedGroups.length) {
        toast.error("En az bir cihaz veya grup seçmelisiniz");
        return;
      }

      // Seçili cihazları güncelle
      if (selectedDevices.length > 0) {
        const devicePromises = selectedDevices.map(deviceId =>
          fetch(`http://localhost:5000/api/devices/${deviceId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ activePlaylist: playlist._id }),
          })
        );
        await Promise.all(devicePromises);
      }

      // Seçili grupların cihazlarını güncelle
      if (selectedGroups.length > 0) {
        for (const groupId of selectedGroups) {
          const groupResponse = await fetch(`http://localhost:5000/api/device-groups/${groupId}`);
          const group = await groupResponse.json();
          
          if (group?.devices?.length) {
            const groupDevicePromises = group.devices.map((deviceId: string) =>
              fetch(`http://localhost:5000/api/devices/${deviceId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activePlaylist: playlist._id }),
              })
            );
            await Promise.all(groupDevicePromises);
          }
        }
      }

      toast.success("Playlist başarıyla gönderildi");
      onClose();
    } catch (error) {
      console.error("Gönderme hatası:", error);
      toast.error("Playlist gönderilirken bir hata oluştu");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Playlist Gönder: {playlist.name}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Arama */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cihaz veya grup ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Cihazlar */}
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
                            checked={selectedDevices.includes(device._id)}
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

                {/* Gruplar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Gruplar</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={selectAllGroups}
                    >
                      Tümünü Seç
                    </Button>
                  </div>
                  <ScrollArea className="h-[200px] rounded-md border p-2">
                    <div className="space-y-2">
                      {filteredGroups.map((group: any) => (
                        <label
                          key={group._id}
                          className="flex items-center space-x-2 rounded p-2 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedGroups.includes(group._id)}
                            onCheckedChange={() => toggleGroup(group._id)}
                          />
                          <span className="text-sm">{group.name}</span>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                İptal
              </Button>
              <Button type="submit">
                Gönder
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};