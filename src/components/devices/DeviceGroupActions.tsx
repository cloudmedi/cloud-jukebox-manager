import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Save,
  Trash2,
  MoreVertical,
  History,
  BarChart2
} from "lucide-react";
import { useState } from "react";
import { GroupHistoryDialog } from "./group-history/GroupHistoryDialog";
import { GroupStatsDialog } from "./group-stats/GroupStatsDialog";
import { toast } from "sonner";
import type { DeviceGroup } from "./types";

interface DeviceGroupActionsProps {
  group: DeviceGroup;
  onSuccess: () => void;
}

export const DeviceGroupActions = ({ group, onSuccess }: DeviceGroupActionsProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/device-groups/${group._id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Grup silinemedi");

      queryClient.invalidateQueries({ queryKey: ["device-groups"] });
      toast.success("Grup silindi");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Grup silinemedi");
    }
  };

  const handleClone = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/device-groups/${group._id}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${group.name} (Kopya)`,
          createdBy: "admin" // TODO: Gerçek kullanıcı bilgisi eklenecek
        })
      });

      if (!response.ok) throw new Error("Grup kopyalanamadı");

      queryClient.invalidateQueries({ queryKey: ["device-groups"] });
      toast.success("Grup kopyalandı");
    } catch (error) {
      console.error("Clone error:", error);
      toast.error("Grup kopyalanamadı");
    }
  };

  const handleSaveAsTemplate = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/device-groups/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: group.name,
          description: group.description,
          devices: group.devices,
          createdBy: "admin" // TODO: Gerçek kullanıcı bilgisi eklenecek
        })
      });

      if (!response.ok) throw new Error("Şablon oluşturulamadı");

      queryClient.invalidateQueries({ queryKey: ["device-groups"] });
      toast.success("Grup şablon olarak kaydedildi");
    } catch (error) {
      console.error("Template error:", error);
      toast.error("Şablon oluşturulamadı");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background border shadow-lg">
          <DropdownMenuItem onClick={handleClone}>
            <Copy className="mr-2 h-4 w-4" />
            Kopyala
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSaveAsTemplate}>
            <Save className="mr-2 h-4 w-4" />
            Şablon Olarak Kaydet
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsHistoryDialogOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            Geçmiş
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsStatsDialogOpen(true)}>
            <BarChart2 className="mr-2 h-4 w-4" />
            İstatistikler
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Grubu silmek istediğinizden emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Grup kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GroupHistoryDialog
        groupId={group._id}
        open={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
      />

      <GroupStatsDialog
        groupId={group._id}
        open={isStatsDialogOpen}
        onOpenChange={setIsStatsDialogOpen}
      />
    </>
  );
};