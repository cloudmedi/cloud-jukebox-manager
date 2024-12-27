import React from "react";
import { Button } from "@/components/ui/button";

interface VolumeActionsProps {
  onClose: () => void;
  onSave: () => void;
  isLoading?: boolean;
}

const VolumeActions = ({ onClose, onSave, isLoading }: VolumeActionsProps) => {
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        onClick={onClose}
        className="w-24"
        disabled={isLoading}
      >
        İptal
      </Button>
      <Button 
        onClick={onSave}
        className="w-24"
        disabled={isLoading}
      >
        {isLoading ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </div>
  );
};

export default VolumeActions;