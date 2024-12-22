import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { GroupBasicInfo } from "./group-form/GroupBasicInfo";
import { SelectedDevicesList } from "./group-form/SelectedDevicesList";
import { DeviceSelector } from "./group-form/DeviceSelector";

interface Device {
  _id: string;
  name: string;
  location?: string;
}

interface DeviceGroup {
  _id?: string;
  name: string;
  description: string;
  devices: string[];
  status: "active" | "inactive";
  createdBy: string;
}

export interface DeviceGroupFormProps {
  group?: DeviceGroup;
  onSuccess: () => void;
}

export const DeviceGroupForm = ({ group, onSuccess }: DeviceGroupFormProps) => {
  const [name, setName] = useState(group?.name || "");
  const [description, setDescription] = useState(group?.description || "");
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>(
    group?.devices || []
  );

  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) {
        throw new Error("Cihazlar yüklenemedi");
      }
      return response.json();
    },
  });

  // Seçili cihazların detaylı bilgilerini al
  const selectedDevices = devices.filter((device: Device) =>
    selectedDeviceIds.includes(device._id)
  );

  const handleDeviceToggle = (deviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedDeviceIds([...selectedDeviceIds, deviceId]);
    } else {
      setSelectedDeviceIds(selectedDeviceIds.filter((id) => id !== deviceId));
    }
  };

  const handleRemoveDevice = (deviceId: string) => {
    setSelectedDeviceIds(selectedDeviceIds.filter((id) => id !== deviceId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Grup adı zorunludur");
      return;
    }

    const url = group
      ? `http://localhost:5000/api/device-groups/${group._id}`
      : "http://localhost:5000/api/device-groups";

    const method = group ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          devices: selectedDeviceIds,
          createdBy: "Admin",
        }),
      });

      if (!response.ok) {
        throw new Error("Grup kaydedilemedi");
      }

      toast.success(group ? "Grup güncellendi" : "Grup oluşturuldu");
      onSuccess();
    } catch (error) {
      toast.error("Bir hata oluştu");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle>{group ? "Grubu Düzenle" : "Yeni Grup"}</DialogTitle>
        <DialogDescription>
          {group
            ? "Grup bilgilerini ve cihazlarını güncelleyin"
            : "Yeni bir cihaz grubu oluşturun"}
        </DialogDescription>
      </DialogHeader>

      <GroupBasicInfo
        name={name}
        description={description}
        onNameChange={setName}
        onDescriptionChange={setDescription}
      />

      <Separator className="my-4" />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <h4 className="font-medium">
            Seçili Cihazlar ({selectedDevices.length})
          </h4>
        </div>

        <SelectedDevicesList
          selectedDevices={selectedDevices}
          onRemoveDevice={handleRemoveDevice}
        />

        <DeviceSelector
          devices={devices}
          selectedDeviceIds={selectedDeviceIds}
          onDeviceToggle={handleDeviceToggle}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" className="min-w-24">
          {group ? "Güncelle" : "Oluştur"}
        </Button>
      </div>
    </form>
  );
};