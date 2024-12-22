import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { DeviceGroupForm } from "./DeviceGroupForm";
import { toast } from "sonner";

interface DeviceGroup {
  _id: string;
  name: string;
  description: string;
  devices: string[];
  status: 'active' | 'inactive';
  createdBy: string;
}

interface DeviceGroupActionsProps {
  group: DeviceGroup;
  onSuccess: () => void;
}

export const DeviceGroupActions = ({ group, onSuccess }: DeviceGroupActionsProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Grubu silmek istediğinizden emin misiniz?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/device-groups/${group._id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Grup silinirken bir hata oluştu');
      }

      toast.success('Grup başarıyla silindi');
      onSuccess();
    } catch (error) {
      toast.error('Grup silinirken bir hata oluştu');
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
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Düzenle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DeviceGroupForm 
            group={group} 
            onSuccess={() => {
              setIsEditDialogOpen(false);
              onSuccess();
            }} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
};