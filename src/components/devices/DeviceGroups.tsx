import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DeviceGroupForm } from "./DeviceGroupForm";
import { BulkGroupActions } from "./group-actions/BulkGroupActions";
import { DeviceGroupsTable } from "./table/DeviceGroupsTable";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import type { DeviceGroup } from "./types";

const ITEMS_PER_PAGE = 10;

const DeviceGroups = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ["device-groups", searchQuery],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(
        `http://localhost:5000/api/device-groups?page=${pageParam}&limit=${ITEMS_PER_PAGE}&search=${searchQuery}`
      );
      if (!response.ok) throw new Error("Gruplar yüklenirken bir hata oluştu");
      return response.json();
    },
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.hasMore) return undefined;
      return pages.length + 1;
    },
    initialPageParam: 1,
  });

  const deleteMutation = useMutation({
    mutationFn: async (groupIds: string[]) => {
      await Promise.all(
        groupIds.map(async (groupId) => {
          const response = await fetch(`http://localhost:5000/api/device-groups/${groupId}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error(`Failed to delete group ${groupId}`);
        })
      );
    },
    onMutate: async (groupIds) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["device-groups"] });

      // Snapshot the previous value
      const previousGroups = queryClient.getQueryData(["device-groups"]);

      // Optimistically remove the deleted groups
      queryClient.setQueryData(["device-groups"], (old: any) => ({
        pages: old.pages.map((page: any) => ({
          ...page,
          groups: page.groups.filter((group: DeviceGroup) => !groupIds.includes(group._id))
        }))
      }));

      return { previousGroups };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousGroups) {
        queryClient.setQueryData(["device-groups"], context.previousGroups);
      }
      toast.error("Gruplar silinirken bir hata oluştu");
    },
    onSuccess: () => {
      toast.success("Seçili gruplar başarıyla silindi");
      setSelectedGroups([]);
    }
  });

  // Intersection Observer için useEffect
  if (inView && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  const handleBulkDelete = async (groupIds: string[]) => {
    try {
      await deleteMutation.mutateAsync(groupIds);
    } catch (error) {
      console.error('Bulk delete error:', error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allGroups = data?.pages.flatMap(page => page.groups.map((group: DeviceGroup) => group._id)) || [];
      setSelectedGroups(allGroups);
    } else {
      setSelectedGroups([]);
    }
  };

  const handleSelectGroup = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedGroups(prev => [...prev, groupId]);
    } else {
      setSelectedGroups(prev => prev.filter(id => id !== groupId));
    }
  };

  const allGroups = data?.pages.flatMap(page => page.groups) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Cihaz Grupları</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>Yeni Grup</Button>
          </DialogTrigger>
          <DialogContent>
            <DeviceGroupForm onSuccess={() => {
              setIsFormOpen(false);
              queryClient.invalidateQueries({ queryKey: ["device-groups"] });
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Grup adı veya açıklama ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {selectedGroups.length > 0 && (
        <BulkGroupActions
          selectedGroups={selectedGroups}
          onClearSelection={() => setSelectedGroups([])}
          onDeleteGroups={handleBulkDelete}
        />
      )}

      <DeviceGroupsTable
        groups={allGroups}
        selectedGroups={selectedGroups}
        onSelectAll={handleSelectAll}
        onSelectGroup={handleSelectGroup}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["device-groups"] })}
      />

      {(hasNextPage || isFetchingNextPage) && (
        <div ref={ref} className="flex justify-center p-4">
          {isFetchingNextPage && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          )}
        </div>
      )}
    </div>
  );
};

export default DeviceGroups;