import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface GroupSelectProps {
  form: any;
  onSelect: (value: string) => void;
}

export const GroupSelect = ({ form, onSelect }: GroupSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: groups = [] } = useQuery({
    queryKey: ["device-groups"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      if (!response.ok) throw new Error("Gruplar yüklenemedi");
      return response.json();
    },
    initialData: []
  });

  const filteredGroups = groups?.filter((group: any) =>
    group?.name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {form.watch("targetGroups")?.[0]
            ? groups?.find((group: any) => group?._id === form.watch("targetGroups")?.[0])?.name || "Grup seçin..."
            : "Grup seçin..."}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Grup ara..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>Grup bulunamadı.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {filteredGroups.map((group: any) => (
              <CommandItem
                key={group._id}
                value={group._id}
                onSelect={(value) => {
                  onSelect(value);
                  setOpen(false);
                }}
              >
                {group.name || "İsimsiz Grup"}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};