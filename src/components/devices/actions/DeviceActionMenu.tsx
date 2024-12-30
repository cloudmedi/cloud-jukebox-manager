import { Device } from "@/services/deviceService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Power,
  RefreshCcw,
  Volume2,
  Users,
  Info,
  Trash2,
  MoreVertical,
  Play,
  Pause,
  AlertOctagon,
  Camera
} from "lucide-react";

interface DeviceActionMenuProps {
  device: Device;
  isEmergencyActive: boolean;
  onPlayPause: () => void;
  onVolumeClick: () => void;
  onGroupClick: () => void;
  onDetailsClick: () => void;
  onRestartClick: () => void;
  onDeleteClick: () => void;
  onEmergencyClick: () => void;
  onScreenshotClick: () => void;
}

export const DeviceActionMenu = ({
  device,
  isEmergencyActive,
  onPlayPause,
  onVolumeClick,
  onGroupClick,
  onDetailsClick,
  onRestartClick,
  onDeleteClick,
  onEmergencyClick,
  onScreenshotClick,
}: DeviceActionMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border shadow-lg">
        <DropdownMenuItem onClick={onPlayPause}>
          {device.isPlaying ? (
            <Pause className="mr-2 h-4 w-4" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {device.isPlaying ? 'Duraklat' : 'Çal'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRestartClick}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Yeniden Başlat
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onVolumeClick}>
          <Volume2 className="mr-2 h-4 w-4" />
          Ses Kontrolü
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onGroupClick}>
          <Users className="mr-2 h-4 w-4" />
          Grup Yönetimi
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onScreenshotClick}>
          <Camera className="mr-2 h-4 w-4" />
          Ekran Görüntüsü Al
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDetailsClick}>
          <Info className="mr-2 h-4 w-4" />
          Cihaz Detayları
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEmergencyClick}>
          <AlertOctagon className={`mr-2 h-4 w-4 ${isEmergencyActive ? 'text-red-500' : ''}`} />
          {isEmergencyActive ? 'Acil Durumu Kaldır' : 'Acil Durum Durdurma'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDeleteClick} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Cihazı Sil
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};