import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface Group {
  _id: string;
  name: string;
}

interface GroupManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentGroupId: string | null;
  onGroupChange: (groupId: string | null) => void;
}

const GroupManagementDialog = ({
  isOpen,
  onClose,
  currentGroupId,
  onGroupChange,
}: GroupManagementDialogProps) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(currentGroupId);

  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ["device-groups"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      if (!response.ok) throw new Error("Gruplar yüklenemedi");
      return response.json();
    },
  });

  useEffect(() => {
    setSelectedGroupId(currentGroupId);
  }, [currentGroupId]);

  const handleSave = () => {
    onGroupChange(selectedGroupId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grup Yönetimi</DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <Select
            value={selectedGroupId || ""}
            onValueChange={(value) => setSelectedGroupId(value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Grup seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Grup Yok</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group._id} value={group._id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button onClick={handleSave}>
              Kaydet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupManagementDialog;