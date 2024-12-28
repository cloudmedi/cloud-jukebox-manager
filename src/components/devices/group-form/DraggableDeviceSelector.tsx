import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { DraggableDeviceItem } from "./DraggableDeviceItem";

interface Device {
  _id: string;
  name: string;
  location?: string;
}

interface DraggableDeviceSelectorProps {
  devices: Device[];
  selectedDeviceIds: string[];
  onDeviceToggle: (deviceId: string, checked: boolean) => void;
}

export const DraggableDeviceSelector = ({
  devices,
  selectedDeviceIds,
  onDeviceToggle,
}: DraggableDeviceSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const sensors = useSensors(useSensor(PointerSensor));

  const filteredDevices = devices.filter(
    (device) =>
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && !selectedDeviceIds.includes(active.id as string)) {
      onDeviceToggle(active.id as string, true);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cihaz ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredDevices.map(d => d._id)} strategy={verticalListSortingStrategy}>
          <ScrollArea className="h-[200px] border rounded-md p-2">
            {filteredDevices.map((device) => (
              <DraggableDeviceItem
                key={device._id}
                device={device}
                isSelected={selectedDeviceIds.includes(device._id)}
                onToggle={(checked) => onDeviceToggle(device._id, checked)}
              />
            ))}
          </ScrollArea>
        </SortableContext>
      </DndContext>
    </div>
  );
};