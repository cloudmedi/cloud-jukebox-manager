import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search } from "lucide-react";

interface SendPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: {
    _id: string;
    name: string;
  };
}

export const SendPlaylistDialog = ({ isOpen, onClose, playlist }: SendPlaylistDialogProps) => {
  const { toast } = useToast();
  const [openDevices, setOpenDevices] = useState(false);
  const [openGroups, setOpenGroups] = useState(false);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");

  const form = useForm({
    defaultValues: {
      targetDevices: [],
      targetGroups: []
    }
  });

  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      try {
        const response = await fetch("http://localhost:5000/api/devices");
        if (!response.ok) throw new Error("Cihazlar yüklenemedi");
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error("Cihaz yükleme hatası:", error);
        return [];
      }
    },
    initialData: []
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["device-groups"],
    queryFn: async () => {
      try {
        const response = await fetch("http://localhost:5000/api/device-groups");
        if (!response.ok) throw new Error("Gruplar yüklenemedi");
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error("Grup yükleme hatası:", error);
        return [];
      }
    },
    initialData: []
  });

  const filteredDevices = Array.isArray(devices) ? devices.filter((device: any) =>
    device?.name?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
    device?.location?.toLowerCase().includes(deviceSearch.toLowerCase())
  ) : [];

  const filteredGroups = Array.isArray(groups) ? groups.filter((group: any) =>
    group?.name?.toLowerCase().includes(groupSearch.toLowerCase())
  ) : [];

  const onSubmit = async (data: any) => {
    try {
      if (data.targetDevices.length > 0) {
        const devicePromises = data.targetDevices.map((deviceId: string) =>
          fetch(`http://localhost:5000/api/devices/${deviceId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              activePlaylist: playlist._id,
            }),
          })
        );
        await Promise.all(devicePromises);
      }

      if (data.targetGroups.length > 0) {
        const groupResponse = await fetch(`http://localhost:5000/api/device-groups/${data.targetGroups[0]}`);
        const group = await groupResponse.json();
        
        const groupDevicePromises = group.devices.map((deviceId: string) =>
          fetch(`http://localhost:5000/api/devices/${deviceId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              activePlaylist: playlist._id,
            }),
          })
        );
        await Promise.all(groupDevicePromises);
      }

      toast({
        title: "Başarılı",
        description: "Playlist başarıyla gönderildi",
      });
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Playlist gönderilirken bir hata oluştu",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Playlist Gönder: {playlist.name}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Popover open={openDevices} onOpenChange={setOpenDevices}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openDevices}
                      className="w-full justify-between"
                    >
                      {form.watch("targetDevices")?.[0]
                        ? devices.find((device: any) => device?._id === form.watch("targetDevices")?.[0])?.name || "Cihaz seçin..."
                        : "Cihaz seçin..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Cihaz ara..."
                        value={deviceSearch}
                        onValueChange={setDeviceSearch}
                      />
                      <CommandEmpty>Cihaz bulunamadı.</CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-auto">
                        {filteredDevices.map((device: any) => (
                          <CommandItem
                            key={device._id}
                            value={device._id}
                            onSelect={(currentValue) => {
                              form.setValue("targetDevices", [currentValue]);
                              setOpenDevices(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{device.name || "İsimsiz Cihaz"}</span>
                              {device.location && (
                                <span className="text-sm text-muted-foreground">
                                  {device.location}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Popover open={openGroups} onOpenChange={setOpenGroups}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openGroups}
                      className="w-full justify-between"
                    >
                      {form.watch("targetGroups")?.[0]
                        ? groups.find((group: any) => group?._id === form.watch("targetGroups")?.[0])?.name || "Grup seçin..."
                        : "Grup seçin..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Grup ara..."
                        value={groupSearch}
                        onValueChange={setGroupSearch}
                      />
                      <CommandEmpty>Grup bulunamadı.</CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-auto">
                        {filteredGroups.map((group: any) => (
                          <CommandItem
                            key={group._id}
                            value={group._id}
                            onSelect={(currentValue) => {
                              form.setValue("targetGroups", [currentValue]);
                              setOpenGroups(false);
                            }}
                          >
                            {group.name || "İsimsiz Grup"}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
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