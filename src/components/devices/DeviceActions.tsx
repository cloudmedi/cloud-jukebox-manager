import { useState } from "react";
import { Device } from "@/services/deviceService";
import { Button } from "@/components/ui/button";
import { DeviceActionMenu } from "./actions/DeviceActionMenu";
import { DeviceActionDialogs } from "./actions/DeviceActionDialogs";
import ScreenshotDialog from "./ScreenshotDialog";

interface DeviceActionsProps {
  device: Device;
}

const DeviceActions = ({ device }: DeviceActionsProps) => {
  const [showVolumeDialog, setShowVolumeDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showScreenshotDialog, setShowScreenshotDialog] = useState(false);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  const handleEmergencyClick = () => {
    setIsEmergencyActive(!isEmergencyActive);
    console.log("Emergency clicked");
  };

  const handlePlayPause = () => {
    console.log("Play/Pause clicked");
  };

  const handleRestartClick = () => {
    console.log("Restart clicked");
  };

  const handleDeleteClick = () => {
    console.log("Delete clicked");
  };

  return (
    <div className="flex items-center gap-2">
      <DeviceActionMenu
        device={device}
        isEmergencyActive={isEmergencyActive}
        onPlayPause={handlePlayPause}
        onVolumeClick={() => setShowVolumeDialog(true)}
        onGroupClick={() => setShowGroupDialog(true)}
        onDetailsClick={() => setShowDetailsDialog(true)}
        onRestartClick={handleRestartClick}
        onDeleteClick={handleDeleteClick}
        onEmergencyClick={handleEmergencyClick}
        onScreenshotClick={() => setShowScreenshotDialog(true)}
      />

      <DeviceActionDialogs
        device={device}
        onVolumeClose={() => setShowVolumeDialog(false)}
        onGroupClose={() => setShowGroupDialog(false)}
        onDetailsClose={() => setShowDetailsDialog(false)}
      />

      <ScreenshotDialog
        deviceId={device.id}
        deviceName={device.name}
        isOpen={showScreenshotDialog}
        onClose={() => setShowScreenshotDialog(false)}
      />
    </div>
  );
};

export default DeviceActions;