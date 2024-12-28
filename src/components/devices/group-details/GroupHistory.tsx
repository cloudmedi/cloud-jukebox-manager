import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { GroupHistory as GroupHistoryType } from "../types";

interface GroupHistoryProps {
  groupId: string;
}

export const GroupHistory = ({ groupId }: GroupHistoryProps) => {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["group-history", groupId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/device-groups/${groupId}/history`);
      if (!response.ok) throw new Error("Geçmiş yüklenemedi");
      return response.json();
    },
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

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {history.map((entry: GroupHistoryType, index: number) => (
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
    </ScrollArea>
  );
};