import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeviceGroup } from "../types";

interface GroupFilterProps {
  groups: DeviceGroup[];
  value: string;
  onChange: (groupId: string) => void;
}

export const GroupFilter = ({ groups, value, onChange }: GroupFilterProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] h-9">
        <SelectValue placeholder="Grup" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="_all">Tüm Gruplar</SelectItem>
        {groups.map((group) => (
          <SelectItem key={group._id} value={group._id}>
            {group.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};