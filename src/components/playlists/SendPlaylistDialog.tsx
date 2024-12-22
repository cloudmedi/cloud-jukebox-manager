import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { DeviceList } from "./send-dialog/DeviceList";
import { GroupList } from "./send-dialog/GroupList";
import { SearchInput } from "./send-dialog/SearchInput";
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
  const form = useForm({
    defaultValues: {
      targetDevices: [],
      targetGroups: []
    }
  });

  const onSubmit = async (data: any) => {
    try {
      if (!data.targetDevices.length && !data.targetGroups.length) {
        toast.error("En az bir cihaz veya grup seçmelisiniz");
        return;
      }

      // WebSocket üzerinden playlist'i gönder
      const ws = new WebSocket('ws://localhost:5000/admin');
      
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'sendPlaylist',
          playlist: playlist._id,
          devices: data.targetDevices,
          groups: data.targetGroups
        }));
      };

      ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        if (response.type === 'playlistSent') {
          toast.success("Playlist başarıyla gönderildi");
          onClose();
        } else if (response.type === 'error') {
          toast.error(response.message || "Playlist gönderilemedi");
        }
      };

      ws.onerror = () => {
        toast.error("Bağlantı hatası oluştu");
      };
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
            <SearchInput value={searchQuery} onChange={setSearchQuery} />
            
            <div className="grid grid-cols-2 gap-4">
              <DeviceList 
                searchQuery={searchQuery} 
                form={form} 
              />
              <GroupList 
                searchQuery={searchQuery} 
                form={form} 
              />
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