import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Play, Pause, Edit, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { AnnouncementForm } from "./AnnouncementForm";
import { toast } from "sonner";
import { AnnouncementFormData } from "./form/types";

interface AnnouncementActionsProps {
  announcement: {
    _id: string;
    title: string;
    content: string;
    status: string;
    scheduleType: "songs" | "minutes" | "specific";
    songInterval?: number;
    minuteInterval?: number;
    specificTimes: string[];
    startDate: Date;
    endDate: Date;
    targetDevices: string[];
    targetGroups: string[];
    duration: number;
    audioFile?: File;
    immediateInterrupt: boolean;
  };
  onPlay?: () => void;
  onPause?: () => void;
  onEdit?: (data: AnnouncementFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export const AnnouncementActions = ({
  announcement,
  onPlay,
  onPause,
  onEdit,
  onDelete,
}: AnnouncementActionsProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = async (data: AnnouncementFormData) => {
    if (!onEdit) return;
    
    try {
      setIsSubmitting(true);
      await onEdit(data);
      setShowEditDialog(false);
      toast.success("Anons güncellendi");
    } catch (error) {
      toast.error("Anons güncellenirken bir hata oluştu");
      console.error("Edit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      await onDelete();
      setShowDeleteDialog(false);
      toast.success("Anons silindi");
    } catch (error) {
      toast.error("Anons silinirken bir hata oluştu");
      console.error("Delete error:", error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onPlay && (
            <DropdownMenuItem onClick={onPlay}>
              <Play className="mr-2 h-4 w-4" />
              Oynat
            </DropdownMenuItem>
          )}
          {onPause && (
            <DropdownMenuItem onClick={onPause}>
              <Pause className="mr-2 h-4 w-4" />
              Duraklat
            </DropdownMenuItem>
          )}
          {onEdit && (
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive"
            >
              <Trash className="mr-2 h-4 w-4" />
              Sil
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Anonsu Düzenle</DialogTitle>
          </DialogHeader>
          <AnnouncementForm
            defaultValues={announcement}
            onSubmit={handleEdit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anonsu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu anonsu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};