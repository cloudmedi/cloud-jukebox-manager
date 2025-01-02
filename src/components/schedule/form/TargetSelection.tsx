import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DeviceList } from "./target/DeviceList";
import { GroupList } from "./target/GroupList";
import { SearchInput } from "./target/SearchInput";

export function TargetSelection() {
  const [deviceSearch, setDeviceSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");

  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    }
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      if (!response.ok) throw new Error("Gruplar yüklenemedi");
      return response.json();
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4 space-y-4">
            <SearchInput
              value={deviceSearch}
              onChange={setDeviceSearch}
              placeholder="Cihaz ara..."
            />
            <DeviceList devices={devices} searchQuery={deviceSearch} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <SearchInput
              value={groupSearch}
              onChange={setGroupSearch}
              placeholder="Grup ara..."
            />
            <GroupList groups={groups} searchQuery={groupSearch} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}