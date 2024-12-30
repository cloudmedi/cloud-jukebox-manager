import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface ScreenshotDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  deviceName: string;
  screenshotData?: string;
}

export const ScreenshotDialog = ({
  isOpen,
  onOpenChange,
  deviceName,
  screenshotData,
}: ScreenshotDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{deviceName} - Ekran Görüntüsü</DialogTitle>
        </DialogHeader>
        <div className="relative min-h-[300px] w-full rounded-md border">
          {screenshotData ? (
            <img
              src={`data:image/png;base64,${screenshotData}`}
              alt="Device Screenshot"
              className="rounded-md"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};