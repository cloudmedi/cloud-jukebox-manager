import { useState } from "react";
import { DeviceList } from "@/components/devices/DeviceList";
import { DeviceHeader } from "@/components/devices/DeviceHeader";

const Devices = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);

  return (
    <div className="space-y-8">
      <DeviceHeader 
        isEmergencyActive={isEmergencyActive}
        setIsEmergencyActive={setIsEmergencyActive}
        isFormOpen={isFormOpen}
        setIsFormOpen={setIsFormOpen}
        showEmergencyDialog={showEmergencyDialog}
        setShowEmergencyDialog={setShowEmergencyDialog}
      />
      <DeviceList />
    </div>
  );
};

export default Devices;