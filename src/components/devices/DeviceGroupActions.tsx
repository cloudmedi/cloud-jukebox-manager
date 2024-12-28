import { useState } from "react";
import { MoreHorizontal, Tags, FolderPlus, Star, StarOff, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GroupTagsDialog } from "./group-tags/GroupTagsDialog";
import { SubgroupDialog } from "./group-hierarchy/SubgroupDialog";

interface DeviceGroupActionsProps {
  group: any;
  onSuccess: () => void;
}

export const DeviceGroupActions = ({ group, onSuccess }: DeviceGroupActionsProps) => {
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [showSubgroupDialog, setShowSubgroupDialog] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Bu grubu silmek istediğinizden emin misiniz?")) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/device-groups/${group._id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Grup silinemedi");

      toast.success("Grup silindi");
      onSuccess();
    } catch (error) {
      toast.error("Bir hata oluştu");
    }
  };

  const toggleFavorite = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/device-groups/${group._id}/favorite`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isFavorite: !group.isFavorite }),
        }
      );

      if (!response.ok) throw new Error("İşlem başarısız");

      toast.success(
        group.isFavorite
          ? "Favorilerden kaldırıldı"
          : "Favorilere eklendi"
      );
      onSuccess();
    } catch (error) {
      toast.error("Bir hata oluştu");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowTagsDialog(true)}>
            <Tags className="h-4 w-4 mr-2" />
            Etiketler
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowSubgroupDialog(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Alt Grup Ekle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleFavorite}>
            {group.isFavorite ? (
              <>
                <StarOff className="h-4 w-4 mr-2" />
                Favorilerden Kaldır
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Favorilere Ekle
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash className="h-4 w-4 mr-2" />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <GroupTagsDialog
        group={group}
        isOpen={showTagsDialog}
        onClose={() => setShowTagsDialog(false)}
        onSuccess={onSuccess}
      />

      <SubgroupDialog
        parentGroup={group}
        isOpen={showSubgroupDialog}
        onClose={() => setShowSubgroupDialog(false)}
        onSuccess={onSuccess}
      />
    </>
  );
};