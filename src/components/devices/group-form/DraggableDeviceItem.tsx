import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { GripVertical } from "lucide-react";

interface Device {
  _id: string;
  name: string;
  location?: string;
}

interface DraggableDeviceItemProps {
  device: Device;
  isSelected: boolean;
  onToggle: (checked: boolean) => void;
}

export const DraggableDeviceItem = ({
  device,
  isSelected,
  onToggle,
}: DraggableDeviceItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: device._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-2 py-2 px-1 hover:bg-muted/50 rounded group ${
        isDragging ? "bg-muted" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 cursor-grab"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Checkbox
        id={device._id}
        checked={isSelected}
        onCheckedChange={onToggle}
      />
      <Label
        htmlFor={device._id}
        className="flex-1 cursor-pointer text-sm"
      >
        <span className="font-medium">{device.name}</span>
        {device.location && (
          <span className="text-muted-foreground ml-2">
            ({device.location})
          </span>
        )}
      </Label>
    </div>
  );
};