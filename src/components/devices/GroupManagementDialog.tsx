import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Group {
  _id: string;
  name: string;
}

interface GroupManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentGroupId: string | null;
  onGroupChange: (groupId: string | null) => Promise<void>;
}

const GroupManagementDialog = ({
  isOpen,
  onClose,
  currentGroupId,
  onGroupChange,
}: GroupManagementDialogProps) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedGroupId(currentGroupId);
  }, [currentGroupId]);

  const { data: groupsResponse } = useQuery({
    queryKey: ["device-groups"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups");
      if (!response.ok) throw new Error("Gruplar yüklenemedi");
      return response.json();
    },
  });

  // Ensure we have an array of groups
  const groups = Array.isArray(groupsResponse?.groups) ? groupsResponse.groups : [];

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onGroupChange(selectedGroupId);
      onClose();
      toast.success("Grup başarıyla güncellendi");
    } catch (error) {
      console.error("Grup güncelleme hatası:", error);
      toast.error("Grup güncellenirken bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedGroup = groups.find((group: Group) => group._id === selectedGroupId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grup Yönetimi</DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <Select
            value={selectedGroupId || undefined}
            onValueChange={(value) => setSelectedGroupId(value)}
            disabled={isSaving}
          >
            <SelectTrigger>
              <SelectValue placeholder="Grup seçin">
                {selectedGroup?.name || "Grup seçin"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Grupsuz</SelectItem>
              {groups.map((group: Group) => (
                <SelectItem key={group._id} value={group._id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isSaving}
            >
              İptal
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupManagementDialog;