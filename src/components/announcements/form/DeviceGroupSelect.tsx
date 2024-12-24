import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface DeviceGroupSelectProps {
  selectedGroups: string[];
  onGroupSelect: (groupId: string) => void;
}

export const DeviceGroupSelect = ({ selectedGroups, onGroupSelect }: DeviceGroupSelectProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: groups = [] } = useQuery({
    queryKey: ["device-groups"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      if (!response.ok) throw new Error("Gruplar yüklenemedi");
      return response.json();
    }
  });

  const filteredGroups = groups.filter((group: any) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
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
        {filteredGroups.map((group: any) => (
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
              <span>{group.name}</span>
            </div>
            <Badge variant={group.status === 'active' ? "success" : "secondary"}>
              {group.status === 'active' ? "Aktif" : "Pasif"}
            </Badge>
          </CommandItem>
        ))}
      </CommandGroup>
    </Command>
  );
};