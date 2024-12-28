import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DeviceGroup } from "../types";
import { DeviceGroupTableRow } from "./DeviceGroupTableRow";

interface DeviceGroupsTableProps {
  groups: DeviceGroup[];
  selectedGroups: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectGroup: (groupId: string, checked: boolean) => void;
  onRefresh: () => void;
}

export const DeviceGroupsTable = ({
  groups,
  selectedGroups,
  onSelectAll,
  onSelectGroup,
  onRefresh
}: DeviceGroupsTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedGroups.length === groups.length && groups.length > 0}
                onCheckedChange={(checked) => onSelectAll(checked === true)}
              />
            </TableHead>
            <TableHead>Grup Adı</TableHead>
            <TableHead>Cihazlar</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Oluşturan</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <DeviceGroupTableRow
              key={group._id}
              group={group}
              isSelected={selectedGroups.includes(group._id)}
              onSelect={onSelectGroup}
              onRefresh={onRefresh}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};