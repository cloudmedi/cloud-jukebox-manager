import { Button } from "@/components/ui/button";
import { Trash2, Power } from "lucide-react";
import { toast } from "sonner";

interface BulkActionsProps {
  selectedGroups: string[];
  onSuccess: () => void;
}

export const BulkActions = ({ selectedGroups, onSuccess }: BulkActionsProps) => {
  const handleBulkDelete = async () => {
    if (!window.confirm(`${selectedGroups.length} grubu silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedGroups.map(groupId =>
          fetch(`http://localhost:5000/api/device-groups/${groupId}`, {
            method: 'DELETE'
          })
        )
      );

      toast.success(`${selectedGroups.length} grup başarıyla silindi`);
      onSuccess();
    } catch (error) {
      toast.error('Gruplar silinirken bir hata oluştu');
    }
  };

  const handleBulkStatusUpdate = async (status: 'active' | 'inactive') => {
    try {
      await Promise.all(
        selectedGroups.map(groupId =>
          fetch(`http://localhost:5000/api/device-groups/${groupId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
          })
        )
      );

      toast.success(`${selectedGroups.length} grubun durumu güncellendi`);
      onSuccess();
    } catch (error) {
      toast.error('Grup durumları güncellenirken bir hata oluştu');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="destructive"
        size="sm"
        onClick={handleBulkDelete}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Sil ({selectedGroups.length})
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleBulkStatusUpdate('active')}
      >
        <Power className="h-4 w-4 mr-2" />
        Aktif Yap
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleBulkStatusUpdate('inactive')}
      >
        <Power className="h-4 w-4 mr-2" />
        Pasif Yap
      </Button>
    </div>
  );
};