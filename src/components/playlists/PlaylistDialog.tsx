import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PlaylistForm } from "./PlaylistForm";
import { cn } from "@/lib/utils";

interface PlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PlaylistDialog = ({ open, onOpenChange }: PlaylistDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-[95vw] h-[90vh] p-0 border-none bg-gradient-to-b from-sidebar-background to-background",
      )}>
        <PlaylistForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};