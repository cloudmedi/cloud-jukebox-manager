import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface SubgroupDialogProps {
  parentGroup: {
    _id: string;
    name: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubgroupDialog = ({ parentGroup, isOpen, onClose, onSuccess }: SubgroupDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Grup adı zorunludur");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/device-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          parentGroup: parentGroup._id,
          createdBy: "Admin",
        }),
      });

      if (!response.ok) throw new Error("Alt grup oluşturulamadı");

      toast.success("Alt grup oluşturuldu");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Bir hata oluştu");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Alt Grup Oluştur</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alt grup adı"
            />
          </div>

          <div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Açıklama"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={handleCreate}>
            Oluştur
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};