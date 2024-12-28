import { Button } from "@/components/ui/button";
import { Volume2, RefreshCcw, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { VolumeSlider } from "./VolumeSlider";
import { useState } from "react";
import websocketService from "@/services/websocketService";

interface QuickActionsProps {
  device: {
    _id: string;
    token: string;
    name: string;
    volume: number;
  };
  onDelete: () => void;
}

export const QuickActions = ({ device, onDelete }: QuickActionsProps) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const handleRestart = async () => {
    try {
      websocketService.sendMessage({
        type: 'command',
        token: device.token,
        command: 'restart'
      });
      toast.success('Yeniden başlatma komutu gönderildi');
    } catch (error) {
      toast.error('Yeniden başlatma komutu gönderilemedi');
    }
  };

  const handleVolumeChange = async (volume: number) => {
    try {
      websocketService.sendMessage({
        type: 'command',
        token: device.token,
        command: 'setVolume',
        volume
      });
      toast.success('Ses seviyesi değiştirme komutu gönderildi');
    } catch (error) {
      toast.error('Ses seviyesi değiştirme komutu gönderilemedi');
    }
  };

  return (
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 backdrop-blur p-1 rounded-lg">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onMouseEnter={() => setShowVolumeSlider(true)}
        onMouseLeave={() => setShowVolumeSlider(false)}
      >
        <Volume2 className="h-4 w-4" />
        {showVolumeSlider && (
          <VolumeSlider
            initialVolume={device.volume}
            onVolumeChange={handleVolumeChange}
            className="absolute bottom-full mb-2 right-0"
          />
        )}
      </Button>
      <Button variant="ghost" size="icon" onClick={handleRestart}>
        <RefreshCcw className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="text-destructive" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};