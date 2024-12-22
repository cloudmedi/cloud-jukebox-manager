import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlaylistForm } from "./PlaylistForm";

interface PlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PlaylistDialog = ({ open, onOpenChange }: PlaylistDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Yeni Playlist Oluştur</DialogTitle>
        </DialogHeader>
        <PlaylistForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};