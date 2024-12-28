import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { GroupHistory } from "../types";

interface GroupHistoryDialogProps {
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GroupHistoryDialog = ({ groupId, open, onOpenChange }: GroupHistoryDialogProps) => {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["group-history", groupId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/device-groups/${groupId}/history`);
      if (!response.ok) throw new Error("Geçmiş yüklenemedi");
      return response.json();
    },
    enabled: open
  });

  const getActionText = (action: string) => {
    switch (action) {
      case "create": return "Oluşturuldu";
      case "update": return "Güncellendi";
      case "delete": return "Silindi";
      case "clone": return "Kopyalandı";
      default: return action;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Grup Geçmişi</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div>Yükleniyor...</div>
          ) : history.length === 0 ? (
            <div>Geçmiş bulunamadı</div>
          ) : (
            <div className="space-y-4">
              {history.map((entry: GroupHistory, index: number) => (
                <div key={index} className="flex items-start gap-4 text-sm">
                  <div className="min-w-24 text-muted-foreground">
                    {format(new Date(entry.timestamp), "dd MMM yyyy HH:mm", { locale: tr })}
                  </div>
                  <div>
                    <div className="font-medium">{getActionText(entry.action)}</div>
                    <div className="text-muted-foreground">
                      {entry.performedBy} tarafından
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};