import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { DeviceSelect } from "./send-dialog/DeviceSelect";
import { GroupSelect } from "./send-dialog/GroupSelect";

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
  const form = useForm({
    defaultValues: {
      targetDevices: [],
      targetGroups: []
    }
  });

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
                <DeviceSelect 
                  form={form} 
                  onSelect={(value) => form.setValue("targetDevices", [value])}
                />
              </div>

              <div>
                <GroupSelect 
                  form={form} 
                  onSelect={(value) => form.setValue("targetGroups", [value])}
                />
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