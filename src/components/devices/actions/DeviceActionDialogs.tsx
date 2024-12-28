import { Device } from "@/services/deviceService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import VolumeControlDialog from "../VolumeControlDialog";
import GroupManagementDialog from "../GroupManagementDialog";
import DeviceDetailsDialog from "../DeviceDetailsDialog";

interface DeviceActionDialogsProps {
  device: Device;
  isVolumeDialogOpen: boolean;
  isGroupDialogOpen: boolean;
  isDetailsDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  isRestartDialogOpen: boolean;
  onVolumeDialogChange: (open: boolean) => void;
  onGroupDialogChange: (open: boolean) => void;
  onDetailsDialogChange: (open: boolean) => void;
  onDeleteDialogChange: (open: boolean) => void;
  onRestartDialogChange: (open: boolean) => void;
  onVolumeChange: (volume: number) => void;
  onGroupChange: (groupId: string | null) => void;
  onDelete: () => void;
  onRestart: () => void;
}

export const DeviceActionDialogs = ({
  device,
  isVolumeDialogOpen,
  isGroupDialogOpen,
  isDetailsDialogOpen,
  isDeleteDialogOpen,
  isRestartDialogOpen,
  onVolumeDialogChange,
  onGroupDialogChange,
  onDetailsDialogChange,
  onDeleteDialogChange,
  onRestartDialogChange,
  onVolumeChange,
  onGroupChange,
  onDelete,
  onRestart,
}: DeviceActionDialogsProps) => {
  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={onDeleteDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cihazı silmek istediğinizden emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Cihaz kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRestartDialogOpen} onOpenChange={onRestartDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cihazı yeniden başlatmak istediğinizden emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Cihaz yeniden başlatılacak ve geçici olarak çevrimdışı olacaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={onRestart}>
              Yeniden Başlat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isVolumeDialogOpen} onOpenChange={onVolumeDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ses Kontrolü</DialogTitle>
          </DialogHeader>
          <VolumeControlDialog
            currentVolume={device.volume}
            onVolumeChange={onVolumeChange}
            onClose={() => onVolumeDialogChange(false)}
          />
        </DialogContent>
      </Dialog>

      <GroupManagementDialog
        isOpen={isGroupDialogOpen}
        currentGroupId={device.groupId}
        onGroupChange={onGroupChange}
        onClose={() => onGroupDialogChange(false)}
      />

      <DeviceDetailsDialog
        device={device}
        isOpen={isDetailsDialogOpen}
        onClose={() => onDetailsDialogChange(false)}
      />
    </>
  );
};