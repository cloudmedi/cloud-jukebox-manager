import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Power,
  Music,
  Volume2,
  Users,
  Info,
  StopCircle,
  Trash2,
  MoreVertical,
} from "lucide-react";
import VolumeControlDialog from "./VolumeControlDialog";
import GroupManagementDialog from "./GroupManagementDialog";
import { deviceService } from "@/services/deviceService";
import { useQueryClient } from "@tanstack/react-query";

interface DeviceActionsProps {
  device: {
    _id: string;
    isOnline: boolean;
    volume: number;
    groupId?: string | null;  // Made groupId optional
  };
}

const DeviceActions = ({ device }: DeviceActionsProps) => {
  const [isVolumeDialogOpen, setIsVolumeDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleRestart = async () => {
    try {
      await deviceService.restartDevice(device._id);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch (error) {
      console.error('Restart error:', error);
    }
  };

  const handlePowerToggle = async () => {
    try {
      await deviceService.togglePower(device._id, device.isOnline);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch (error) {
      console.error('Power toggle error:', error);
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    try {
      await deviceService.setVolume(device._id, newVolume);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch (error) {
      console.error('Volume control error:', error);
    }
  };

  const handleGroupChange = async (groupId: string | null) => {
    try {
      await deviceService.updateGroup(device._id, groupId);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch (error) {
      console.error('Group management error:', error);
    }
  };

  const handleEmergencyStop = async () => {
    if (!window.confirm('Cihazı acil olarak durdurmak istediğinizden emin misiniz?')) return;
    
    try {
      await deviceService.emergencyStop(device._id);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch (error) {
      console.error('Emergency stop error:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Cihazı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await deviceService.deleteDevice(device._id);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleRestart}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Yeniden Başlat
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePowerToggle}>
            <Power className="mr-2 h-4 w-4" />
            {device.isOnline ? 'Cihazı Kapat' : 'Cihazı Aç'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log('Playlist management')}>
            <Music className="mr-2 h-4 w-4" />
            Playlist Yönetimi
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsVolumeDialogOpen(true)}>
            <Volume2 className="mr-2 h-4 w-4" />
            Ses Kontrolü
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsGroupDialogOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Grup Yönetimi
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log('Device details')}>
            <Info className="mr-2 h-4 w-4" />
            Cihaz Detayları
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEmergencyStop} className="text-red-600">
            <StopCircle className="mr-2 h-4 w-4" />
            Acil Durdur
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Cihazı Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <VolumeControlDialog
        isOpen={isVolumeDialogOpen}
        onClose={() => setIsVolumeDialogOpen(false)}
        currentVolume={device.volume}
        onVolumeChange={handleVolumeChange}
      />

      <GroupManagementDialog
        isOpen={isGroupDialogOpen}
        onClose={() => setIsGroupDialogOpen(false)}
        currentGroupId={device.groupId}
        onGroupChange={handleGroupChange}
      />
    </>
  );
};

export default DeviceActions;