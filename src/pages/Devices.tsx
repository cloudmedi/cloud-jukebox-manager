import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DeviceTable from "@/components/devices/DeviceTable";
import NewDeviceDialog from "@/components/devices/NewDeviceDialog";
import DeviceGroupDialog from "@/components/devices/DeviceGroupDialog";
import DeviceGroupList from "@/components/devices/DeviceGroupList";
import { Device } from "@/types/device";

const Devices = () => {
  const [isNewDeviceDialogOpen, setIsNewDeviceDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Failed to fetch devices");
      return response.json();
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Devices</h1>
      <DeviceTable devices={devices} />
      <NewDeviceDialog />
      <DeviceGroupDialog />
      <DeviceGroupList />
    </div>
  );
};

export default Devices;