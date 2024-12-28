import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, CheckCircle2, XCircle } from "lucide-react";
import { DeviceGroup } from "../types";
import { GroupPreviewCard } from "../group-preview/GroupPreviewCard";
import { DeviceGroupActions } from "../DeviceGroupActions";

interface DeviceGroupTableRowProps {
  group: DeviceGroup;
  isSelected: boolean;
  onSelect: (groupId: string, checked: boolean) => void;
  onRefresh: () => void;
}

export const DeviceGroupTableRow = ({
  group,
  isSelected,
  onSelect,
  onRefresh
}: DeviceGroupTableRowProps) => {
  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(group._id, checked === true)}
        />
      </TableCell>
      <TableCell>
        <GroupPreviewCard group={group}>
          <div className="cursor-help">
            <div className="font-medium">{group.name}</div>
            {group.description && (
              <div className="text-sm text-muted-foreground">
                {group.description}
              </div>
            )}
          </div>
        </GroupPreviewCard>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{group.devices.length}</span>
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
      <TableCell className="text-right">
        <DeviceGroupActions group={group} onSuccess={onRefresh} />
      </TableCell>
    </TableRow>
  );
};