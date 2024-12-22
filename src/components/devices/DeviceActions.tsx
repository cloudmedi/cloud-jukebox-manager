import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  Power,
  RefreshCcw,
  Volume2,
  Users,
  Info,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { useState } from "react";
import { deviceService } from "@/services/deviceService";
import VolumeControlDialog from "./VolumeControlDialog";
import GroupManagementDialog from "./GroupManagementDialog";
import DeviceDetailsDialog from "./DeviceDetailsDialog";

interface DeviceActionsProps {
  device: {
    _id: string;
    isOnline: boolean;
    volume: number;
    groupId?: string | null;
  };
}

const DeviceActions = ({ device }: DeviceActionsProps) => {
  const [isVolumeDialogOpen, setIsVolumeDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleRestart = async () => {
    if (!window.confirm('Cihazı yeniden başlatmak istediğinizden emin misiniz?')) return;
    
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

  const handleVolumeChange = async (volume: number) => {
    try {
      await deviceService.setVolume(device._id, volume);
      setIsVolumeDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch (error) {
      console.error('Volume control error:', error);
    }
  };

  const handleGroupChange = async (groupId: string | null) => {
    try {
      await deviceService.updateGroup(device._id, groupId);
      setIsGroupDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch (error) {
      console.error('Group management error:', error);
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
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handlePowerToggle}>
            <Power className="mr-2 h-4 w-4" />
            {device.isOnline ? 'Kapat' : 'Aç'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRestart}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Yeniden Başlat
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsVolumeDialogOpen(true)}>
            <Volume2 className="mr-2 h-4 w-4" />
            Ses Kontrolü
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsGroupDialogOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Grup Yönetimi
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDetailsDialogOpen(true)}>
            <Info className="mr-2 h-4 w-4" />
            Cihaz Detayları
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Cihazı Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isVolumeDialogOpen} onOpenChange={setIsVolumeDialogOpen}>
        <VolumeControlDialog
          isOpen={isVolumeDialogOpen}
          currentVolume={device.volume}
          onVolumeChange={handleVolumeChange}
          onClose={() => setIsVolumeDialogOpen(false)}
        />
      </Dialog>

      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <GroupManagementDialog
          currentGroupId={device.groupId}
          onGroupChange={handleGroupChange}
          onClose={() => setIsGroupDialogOpen(false)}
        />
      </Dialog>

      {isDetailsDialogOpen && (
        <DeviceDetailsDialog
          device={device as Device}
          onClose={() => setIsDetailsDialogOpen(false)}
        />
      )}
    </>
  );
};

export default DeviceActions;