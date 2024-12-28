import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface GroupHistoryDialogProps {
  groupId: string;
}

export const GroupHistoryDialog = ({ groupId }: GroupHistoryDialogProps) => {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["group-history", groupId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/device-groups/${groupId}/history`);
      if (!response.ok) throw new Error("Geçmiş yüklenemedi");
      return response.json();
    }
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
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
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
              {history.map((entry: any, index: number) => (
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