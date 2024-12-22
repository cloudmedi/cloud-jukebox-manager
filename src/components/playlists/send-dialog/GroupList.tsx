import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface GroupListProps {
  searchQuery: string;
  form: any;
}

export const GroupList = ({ searchQuery, form }: GroupListProps) => {
  const { data: groups = [] } = useQuery({
    queryKey: ['device-groups'],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      if (!response.ok) throw new Error("Gruplar yüklenemedi");
      return response.json();
    },
    initialData: []
  });

  const filteredGroups = groups.filter((group: any) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectAllGroups = () => {
    const allGroupIds = filteredGroups.map((group: any) => group._id);
    form.setValue("targetGroups", allGroupIds);
  };

  const toggleGroup = (groupId: string) => {
    const currentGroups = form.watch("targetGroups") || [];
    const newGroups = currentGroups.includes(groupId)
      ? currentGroups.filter((id: string) => id !== groupId)
      : [...currentGroups, groupId];
    
    form.setValue("targetGroups", newGroups);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Gruplar</h3>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={selectAllGroups}
        >
          Tümünü Seç
        </Button>
      </div>
      <ScrollArea className="h-[200px] rounded-md border p-2">
        <div className="space-y-2">
          {filteredGroups.map((group: any) => (
            <label
              key={group._id}
              className="flex items-center space-x-2 rounded p-2 hover:bg-muted/50"
            >
              <Checkbox
                checked={form.watch("targetGroups")?.includes(group._id)}
                onCheckedChange={() => toggleGroup(group._id)}
              />
              <span className="text-sm">{group.name}</span>
            </label>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};