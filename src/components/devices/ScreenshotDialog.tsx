import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface ScreenshotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  screenshotData?: string;
  isLoading: boolean;
}

export const ScreenshotDialog = ({
  isOpen,
  onClose,
  screenshotData,
  isLoading
}: ScreenshotDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Cihaz Ekran Görüntüsü</DialogTitle>
        </DialogHeader>
        <div className="relative min-h-[400px] w-full flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Ekran görüntüsü alınıyor...
              </p>
            </div>
          ) : screenshotData ? (
            <img 
              src={screenshotData} 
              alt="Device Screenshot" 
              className="max-w-full h-auto rounded-lg shadow-lg"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Ekran görüntüsü alınamadı
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};