import { FormField } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Info } from "lucide-react";
import { useFormContext } from "react-hook-form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface GroupListProps {
  groups: any[];
  searchQuery: string;
}

export function GroupList({ groups, searchQuery }: GroupListProps) {
  const form = useFormContext();
  const selectedGroups = form.watch("targetGroups") || [];

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = () => {
    const allSelected = filteredGroups.every((group) => 
      selectedGroups.includes(group._id)
    );
    
    const newValue = allSelected
      ? selectedGroups.filter((id: string) => 
          !filteredGroups.find((group) => group._id === id)
        )
      : [...new Set([...selectedGroups, ...filteredGroups.map((g) => g._id)])];
    
    form.setValue("targetGroups", newValue);
  };

  const areAllSelected = filteredGroups.length > 0 && 
    filteredGroups.every((group) => selectedGroups.includes(group._id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Gruplar</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Zamanlamanın uygulanacağı grupları seçin</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          {areAllSelected && <Check className="h-4 w-4" />}
          Tümü
        </Button>
      </div>

      <div className="space-y-1">
        {filteredGroups.map((group) => (
          <FormField
            key={group._id}
            name="targetGroups"
            render={({ field }) => (
              <label className="flex items-center p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <Checkbox
                  checked={field.value?.includes(group._id)}
                  onCheckedChange={(checked) => {
                    const newValue = checked
                      ? [...(field.value || []), group._id]
                      : field.value?.filter((id: string) => id !== group._id);
                    field.onChange(newValue);
                  }}
                />
                <div className="ml-3">
                  <p className="text-sm font-medium">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.devices?.length || 0} cihaz
                  </p>
                </div>
              </label>
            )}
          />
        ))}
      </div>
    </div>
  );
}