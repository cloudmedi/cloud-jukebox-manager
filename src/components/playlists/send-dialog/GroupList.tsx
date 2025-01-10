import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form";

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">Gruplar</h3>
          <button
            type="button"
            onClick={() => {
              const currentValue = form.getValues('targetGroups') || [];
              const allGroupIds = filteredGroups.map(g => g._id);
              if (currentValue.length === allGroupIds.length) {
                form.setValue('targetGroups', []);
              } else {
                form.setValue('targetGroups', allGroupIds);
              }
            }}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Tümü
          </button>
        </div>
        <span className="text-xs text-gray-500">
          {filteredGroups.length} grup
        </span>
      </div>
      
      <ScrollArea className="h-[320px] rounded-lg border border-gray-200 bg-white">
        <div className="p-1.5">
          <FormField
            control={form.control}
            name="targetGroups"
            render={({ field }) => (
              <div className="space-y-1">
                {filteredGroups.map((group) => (
                  <label
                    key={group._id}
                    className={`group flex items-center gap-3 p-2 rounded-md transition-all cursor-pointer
                      ${field.value?.includes(group._id) ? 'bg-primary/15' : 'hover:bg-gray-100'}
                    `}
                  >
                    <div className="relative flex items-center justify-center">
                      <Checkbox
                        id={group._id}
                        checked={field.value?.includes(group._id)}
                        onCheckedChange={(checked) => {
                          const newValue = checked
                            ? [...(field.value || []), group._id]
                            : (field.value || []).filter((id: string) => id !== group._id);
                          field.onChange(newValue);
                        }}
                        className="w-4 h-4 border-gray-300 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                      <div className={`absolute w-8 h-8 rounded-full transition-all scale-0 bg-primary/10
                        ${field.value?.includes(group._id) ? 'scale-100' : 'group-hover:scale-90'}
                      `} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate
                          ${field.value?.includes(group._id) ? 'text-gray-900' : 'text-gray-700'}
                        `}>
                          {group.name}
                        </span>
                      </div>
                      {group.description && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {group.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          />
        </div>
      </ScrollArea>
    </div>
  );
};