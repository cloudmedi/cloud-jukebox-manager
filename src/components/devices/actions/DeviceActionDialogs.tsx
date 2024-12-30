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
  onVolumeClose: () => void;
  onGroupClose: () => void;
  onDetailsClose: () => void;
}

export const DeviceActionDialogs = ({
  device,
  onVolumeClose,
  onGroupClose,
  onDetailsClose,
}: DeviceActionDialogsProps) => {
  return (
    <>
      <Dialog open={false} onOpenChange={() => onVolumeClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ses Kontrolü</DialogTitle>
          </DialogHeader>
          <VolumeControlDialog
            currentVolume={device.volume}
            onVolumeChange={() => {}}
            onClose={onVolumeClose}
          />
        </DialogContent>
      </Dialog>

      <GroupManagementDialog
        isOpen={false}
        currentGroupId={device.groupId}
        onGroupChange={async () => {}}
        onClose={onGroupClose}
      />

      <DeviceDetailsDialog
        device={device}
        isOpen={false}
        onClose={onDetailsClose}
      />
    </>
  );
};