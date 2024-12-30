import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ScreenshotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deviceToken: string;
}

export function ScreenshotDialog({ isOpen, onClose, deviceToken }: ScreenshotDialogProps) {
  const [screenshotData, setScreenshotData] = useState<string | null>(null);

  useEffect(() => {
    const handleScreenshot = (event: any) => {
      const message = JSON.parse(event.data);
      if (message.type === 'screenshot' && message.token === deviceToken) {
        if (message.success && message.data) {
          setScreenshotData(message.data);
        } else {
          toast.error('Ekran görüntüsü alınamadı');
          onClose();
        }
      }
    };

    // Add WebSocket event listener
    const ws = new WebSocket('ws://localhost:5000/admin');
    ws.addEventListener('message', handleScreenshot);

    return () => {
      ws.removeEventListener('message', handleScreenshot);
      setScreenshotData(null);
    };
  }, [deviceToken]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Cihaz Ekran Görüntüsü</h2>
          {screenshotData ? (
            <img 
              src={`data:image/png;base64,${screenshotData}`} 
              alt="Device Screenshot" 
              className="w-full rounded-lg shadow-lg"
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}