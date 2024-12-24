import { useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DeviceGroup } from "../types/announcement";

interface DeviceGroupSelectProps {
  groups: DeviceGroup[];
  selectedGroups: string[];
  onGroupSelect: (groupId: string) => void;
}

export const DeviceGroupSelect = ({ groups, selectedGroups, onGroupSelect }: DeviceGroupSelectProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput 
        placeholder="Grup ara..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandEmpty>Grup bulunamadı.</CommandEmpty>
      <CommandGroup className="max-h-[200px] overflow-y-auto">
        {filteredGroups.map((group) => (
          <CommandItem
            key={group._id}
            value={group._id}
            onSelect={() => onGroupSelect(group._id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center">
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selectedGroups.includes(group._id) ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="flex flex-col">
                <span>{group.name}</span>
                {group.description && (
                  <span className="text-sm text-muted-foreground">
                    {group.description}
                  </span>
                )}
              </div>
            </div>
            <Badge
              variant={group.status === 'active' ? "success" : "secondary"}
              className="ml-auto"
            >
              {group.status === 'active' ? "Aktif" : "Pasif"}
            </Badge>
          </CommandItem>
        ))}
      </CommandGroup>
    </Command>
  );
};