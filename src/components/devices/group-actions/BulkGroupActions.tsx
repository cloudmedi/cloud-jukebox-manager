import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, CheckSquare, X } from "lucide-react";
import { toast } from "sonner";

interface BulkGroupActionsProps {
  selectedGroups: string[];
  onClearSelection: () => void;
  onDeleteGroups: (groupIds: string[]) => Promise<void>;
}

export const BulkGroupActions = ({
  selectedGroups,
  onClearSelection,
  onDeleteGroups,
}: BulkGroupActionsProps) => {
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

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
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
          <DropdownMenuItem onClick={handleBulkDelete}>
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