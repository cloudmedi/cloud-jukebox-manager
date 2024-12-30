import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Camera } from "lucide-react";

interface ScreenshotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deviceName: string;
}

export const ScreenshotDialog = ({ isOpen, onClose, deviceName }: ScreenshotDialogProps) => {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const captureScreenshot = async () => {
    try {
      setIsLoading(true);
      const screenshotData = await window.electron.captureScreenshot();
      setScreenshot(screenshotData);
    } catch (error) {
      console.error('Screenshot error:', error);
      toast.error('Ekran görüntüsü alınamadı');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      captureScreenshot();
    } else {
      setScreenshot(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {deviceName} - Ekran Görüntüsü
          </DialogTitle>
          <DialogDescription>
            Cihazın anlık ekran görüntüsü
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-[300px] w-full rounded-lg border bg-muted">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : screenshot ? (
            <img
              src={screenshot}
              alt="Device Screenshot"
              className="rounded-lg w-full h-auto"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              Ekran görüntüsü alınamadı
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};