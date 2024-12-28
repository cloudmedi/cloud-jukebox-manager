import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2, XCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DeviceGroupActions } from "../DeviceGroupActions";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DeviceGroup } from "../types";

interface SortableTableRowProps {
  group: DeviceGroup;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onSuccess: () => void;
}

export const SortableTableRow = ({ group, selected, onSelect, onSuccess }: SortableTableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: group._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getGroupColor = (groupId: string) => {
    const colors = [
      "hover:bg-blue-50/50", "hover:bg-green-50/50", "hover:bg-purple-50/50",
      "hover:bg-pink-50/50", "hover:bg-yellow-50/50", "hover:bg-orange-50/50"
    ];
    const hash = groupId.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      className={`${getGroupColor(group._id)} cursor-move`}
      {...attributes} 
      {...listeners}
    >
      <TableCell>
        <Checkbox checked={selected} onCheckedChange={onSelect} />
      </TableCell>
      <TableCell className="font-medium">{group.name}</TableCell>
      <TableCell>{group.description}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{group.devices.length}</span>
        </div>
      </TableCell>
      <TableCell>
        {group.status === 'active' ? (
          <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aktif
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-gray-500/15 text-gray-500 hover:bg-gray-500/25">
            <XCircle className="h-3 w-3 mr-1" />
            Pasif
          </Badge>
        )}
      </TableCell>
      <TableCell>{group.createdBy}</TableCell>
      <TableCell>
        {new Date(group.createdAt).toLocaleString("tr-TR")}
      </TableCell>
      <TableCell className="text-right">
        <DeviceGroupActions group={group} onSuccess={onSuccess} />
      </TableCell>
    </TableRow>
  );
};