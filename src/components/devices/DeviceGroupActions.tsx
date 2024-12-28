import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Copy, Save, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { GroupHistoryDialog } from "./group-history/GroupHistoryDialog";
import { GroupStatsDialog } from "./group-stats/GroupStatsDialog";

interface DeviceGroupActionsProps {
  group: any;
  onSuccess: () => void;
}

export const DeviceGroupActions = ({ group, onSuccess }: DeviceGroupActionsProps) => {
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/device-groups/${group._id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Grup silinemedi");

      toast({
        title: "Başarılı",
        description: "Grup silindi",
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Grup silinirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleClone = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/device-groups/${group._id}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${group.name} Kopyası`,
          createdBy: "admin" // TODO: Gerçek kullanıcı bilgisi eklenecek
        })
      });

      if (!response.ok) throw new Error("Grup kopyalanamadı");

      toast({
        title: "Başarılı",
        description: "Grup kopyalandı",
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Grup kopyalanırken bir hata oluştu",
        variant: "destructive",
      });
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

      toast({
        title: "Başarılı",
        description: "Grup şablon olarak kaydedildi",
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Şablon oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <GroupHistoryDialog groupId={group._id} />
      <GroupStatsDialog groupId={group._id} />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleClone}>
            <Copy className="h-4 w-4 mr-2" />
            Kopyala
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSaveAsTemplate}>
            <Save className="h-4 w-4 mr-2" />
            Şablon Olarak Kaydet
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash className="h-4 w-4 mr-2" />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};