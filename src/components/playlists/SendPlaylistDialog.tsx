import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Device } from "@/types/device";
import type { Playlist } from "@/types/playlist";
import websocketService from "@/services/websocketService";

interface SendPlaylistDialogProps {
  playlist: Playlist;
  isOpen: boolean;
  onClose: () => void;
}

export const SendPlaylistDialog = ({ playlist, isOpen, onClose }: SendPlaylistDialogProps) => {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [sendingDevices, setSendingDevices] = useState<string[]>([]);
  const [completedDevices, setCompletedDevices] = useState<string[]>([]);
  const [failedDevices, setFailedDevices] = useState<string[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Failed to fetch devices");
      return response.json();
    },
  });

  useEffect(() => {
    const handlePlaylistStatus = (message: any) => {
      if (message.type === 'deviceStatus' && message.playlistStatus) {
        const deviceId = message.token;

        if (message.playlistStatus === 'loading') {
          setSendingDevices(prev => [...new Set([...prev, deviceId])]);
          setDownloadProgress(prev => ({
            ...prev,
            [deviceId]: message.downloadProgress || 0
          }));
        } else if (message.playlistStatus === 'loaded') {
          setCompletedDevices(prev => [...new Set([...prev, deviceId])]);
          setSendingDevices(prev => prev.filter(id => id !== deviceId));
        } else if (message.playlistStatus === 'error') {
          setFailedDevices(prev => [...new Set([...prev, deviceId])]);
          setSendingDevices(prev => prev.filter(id => id !== deviceId));
        }
      }
    };

    websocketService.addMessageHandler('playlistStatus', handlePlaylistStatus);

    return () => {
      websocketService.removeMessageHandler('playlistStatus', handlePlaylistStatus);
    };
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDevices(devices.map(device => device._id));
    } else {
      setSelectedDevices([]);
    }
  };

  const handleSelectDevice = (deviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedDevices(prev => [...prev, deviceId]);
    } else {
      setSelectedDevices(prev => prev.filter(id => id !== deviceId));
    }
  };

  const handleSend = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/devices/bulk/playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceIds: selectedDevices,
          playlistId: playlist._id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send playlist');
      }

      toast.success('Playlist gönderme işlemi başlatıldı');
    } catch (error) {
      console.error('Error sending playlist:', error);
      toast.error('Playlist gönderilemedi');
    }
  };

  const handleClose = () => {
    setSelectedDevices([]);
    setSendingDevices([]);
    setCompletedDevices([]);
    setFailedDevices([]);
    setDownloadProgress({});
    onClose();
  };

  const renderDeviceStatus = (device: Device) => {
    if (completedDevices.includes(device._id)) {
      return (
        <div className="flex items-center gap-2 text-emerald-500">
          <CheckCircle2 className="h-4 w-4" />
          <span>Tamamlandı</span>
        </div>
      );
    }

    if (failedDevices.includes(device._id)) {
      return (
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span>Hata</span>
        </div>
      );
    }

    if (sendingDevices.includes(device._id)) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-orange-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Gönderiliyor</span>
          </div>
          <Progress 
            value={downloadProgress[device._id] || 0} 
            className="h-2"
          />
          <div className="text-xs text-muted-foreground">
            %{Math.round(downloadProgress[device._id] || 0)}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Playlist'i Cihazlara Gönder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedDevices.length === devices.length}
              onCheckedChange={handleSelectAll}
            />
            <span>Tüm Cihazları Seç</span>
          </div>

          <ScrollArea className="h-[400px] rounded-md border p-4">
            <div className="space-y-4">
              {devices.map(device => (
                <div key={device._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedDevices.includes(device._id)}
                      onCheckedChange={(checked) => handleSelectDevice(device._id, checked as boolean)}
                    />
                    <span>{device.name}</span>
                  </div>
                  {renderDeviceStatus(device)}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              İptal
            </Button>
            <Button
              onClick={handleSend}
              disabled={selectedDevices.length === 0 || sendingDevices.length > 0}
            >
              Gönder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};