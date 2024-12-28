import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";

interface GroupBulkActionsProps {
  selectedGroups: string[];
  onClearSelection: () => void;
  onDeleteGroups: (groupIds: string[]) => Promise<void>;
  onCloneGroups: (groupIds: string[]) => Promise<void>;
}

export const GroupBulkActions = ({
  selectedGroups,
  onClearSelection,
  onDeleteGroups,
  onCloneGroups,
}: GroupBulkActionsProps) => {
  const handleBulkDelete = async () => {
    if (!window.confirm("Seçili grupları silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      await onDeleteGroups(selectedGroups);
      toast.success("Seçili gruplar başarıyla silindi");
      onClearSelection();
    } catch (error) {
      toast.error("Gruplar silinirken bir hata oluştu");
    }
  };

  const handleBulkClone = async () => {
    try {
      await onCloneGroups(selectedGroups);
      toast.success("Seçili gruplar başarıyla kopyalandı");
      onClearSelection();
    } catch (error) {
      toast.error("Gruplar kopyalanırken bir hata oluştu");
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">
        {selectedGroups.length} grup seçildi
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Toplu İşlemler
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleBulkClone}>
            <Copy className="mr-2 h-4 w-4" />
            Kopyala
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleBulkDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        className="ml-auto"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};