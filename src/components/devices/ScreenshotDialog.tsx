import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface ScreenshotDialogProps {
  deviceName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ScreenshotDialog = ({ deviceName, isOpen, onClose }: ScreenshotDialogProps) => {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const captureScreen = async () => {
    try {
      setIsLoading(true);
      // Electron IPC üzerinden ekran görüntüsü alma isteği gönder
      const screenshotData = await window.electron.captureScreen();
      setScreenshot(screenshotData);
    } catch (error) {
      console.error('Screenshot error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setScreenshot(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{deviceName} - Ekran Görüntüsü</span>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4">
          {!screenshot ? (
            <Button 
              onClick={captureScreen} 
              disabled={isLoading}
              className="w-full"
            >
              <Camera className="mr-2 h-4 w-4" />
              {isLoading ? 'Görüntü Alınıyor...' : 'Ekran Görüntüsü Al'}
            </Button>
          ) : (
            <div className="relative w-full">
              <img 
                src={screenshot} 
                alt="Device Screenshot" 
                className="w-full rounded-lg border"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScreenshotDialog;