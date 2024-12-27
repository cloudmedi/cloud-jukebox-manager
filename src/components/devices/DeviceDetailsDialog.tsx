import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Device } from "@/services/deviceService";
import { BasicInfo } from "./device-details/BasicInfo";
import { PlaylistInfo } from "./device-details/PlaylistInfo";
import { SystemInfo } from "./device-details/SystemInfo";
import { TimeInfo } from "./device-details/TimeInfo";

interface DeviceDetailsDialogProps {
  device: Device;
  isOpen: boolean;
  onClose: () => void;
}

const DeviceDetailsDialog = ({
  device,
  isOpen,
  onClose,
}: DeviceDetailsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Cihaz Detayları</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-6 p-4">
            <BasicInfo device={device} />
            <Separator />
            <PlaylistInfo device={device} />
            <Separator />
            <SystemInfo device={device} />
            <Separator />
            <TimeInfo device={device} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDetailsDialog;